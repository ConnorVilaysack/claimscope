import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TemplateSection {
  heading: string;
  description: string;
  fields?: string[];
}

interface TemplateStructure {
  sections: TemplateSection[];
  tone: string;
  formatting_notes: string;
}

function buildDefaultSystemPrompt(): string {
  return `You are an experienced insurance loss assessor writing a professional property damage inspection report. Generate a comprehensive, industry-standard report in markdown format.

Follow this exact structure:

# Property Damage Inspection Report

## 1. Executive Summary
A concise 2-3 sentence overview: primary damage type, overall severity, and recommended course of action.

## 2. Property Details
Use this format:
- **Address:** [the address]
- **Inspection Date:** [the date]
- **Report Reference:** [the reference number]
- **Assessment Method:** On-site photographic inspection with automated analysis

## 3. Damage Assessment Summary
Create a markdown table summarizing all damage found:

| Area | Damage Type | Severity | Key Materials |
|------|------------|----------|---------------|
| ... | ... | ... | ... |

## 4. Detailed Findings
For each affected area, write a subsection (### Area Name) covering:
- Location and extent of damage
- Type and probable cause
- Materials and finishes affected
- Reference to photographic evidence (e.g., "See Photo 1")

## 5. Recommended Scope of Works
An itemized list of recommended repairs. For each item include:
- Description of work required
- Estimated scope (e.g., "Replace approx. 12m² of plasterboard ceiling")
- Priority: **Urgent**, **Standard**, or **Low**

## 6. Materials Schedule
A bulleted list of all materials requiring replacement or repair, grouped by area.

## 7. Additional Notes
Include inspector notes if provided. If none, write "No additional notes recorded."

Write in a professional, objective tone. Be specific about damage descriptions — avoid vague language. Use metric measurements where appropriate.`;
}

function buildTemplateSystemPrompt(
  template: TemplateStructure,
  templateName: string
): string {
  const sectionInstructions = template.sections
    .map((section, i) => {
      let instruction = `## ${i + 1}. ${section.heading}\n${section.description}`;
      if (section.fields && section.fields.length > 0) {
        instruction += `\nFields to include: ${section.fields.join(", ")}`;
      }
      return instruction;
    })
    .join("\n\n");

  return `You are an experienced insurance loss assessor writing a professional property damage inspection report. Generate a comprehensive report in markdown format following the "${templateName}" template structure EXACTLY.

You MUST follow this specific report structure — every section must appear in this order:

${sectionInstructions}

Writing style: ${template.tone || "Professional, objective, specific. Avoids vague language."}

Formatting requirements: ${template.formatting_notes || "Use markdown format. Tables where appropriate. Photo references throughout."}

IMPORTANT:
- Follow the section order EXACTLY as specified above.
- Include ALL sections even if some have limited data — write "No information available" rather than omitting a section.
- Use the field labels exactly as specified where fields are listed.
- Reference photos by number (e.g., "See Photo 1") throughout the report.
- Be specific about damage descriptions, materials, and measurements.
- Use metric measurements where appropriate.`;
}

export async function POST(request: NextRequest) {
  try {
    const { analyses, notes, address, templateStructure, templateName } =
      await request.json();

    if (!analyses || !Array.isArray(analyses)) {
      return NextResponse.json(
        { error: "analyses array is required" },
        { status: 400 }
      );
    }

    const damageData = analyses
      .map(
        (
          a: {
            room_type: string;
            damage_type: string;
            severity: string;
            materials_affected: string[];
            description: string;
            photo_label?: string;
          },
          i: number
        ) =>
          `Photo ${i + 1}${a.photo_label && a.photo_label !== "general" ? ` (${a.photo_label.replace(/_/g, " ")})` : ""}:
  Room/Area: ${a.room_type}
  Damage Type: ${a.damage_type}
  Severity: ${a.severity}
  Materials Affected: ${a.materials_affected.join(", ")}
  Description: ${a.description}`
      )
      .join("\n\n");

    const inspectionDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const refNumber = `CS-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    const systemPrompt =
      templateStructure && templateName
        ? buildTemplateSystemPrompt(templateStructure, templateName)
        : buildDefaultSystemPrompt();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate the inspection report for:

Property Address: ${address}
Inspection Date: ${inspectionDate}
Report Reference: ${refNumber}
Number of Photos Analyzed: ${analyses.length}

Photo Analyses:
${damageData}

${notes ? `Inspector Notes:\n${notes}` : "No additional inspector notes provided."}`,
        },
      ],
      max_tokens: 6000,
      temperature: 0.3,
    });

    const report = response.choices[0]?.message?.content || "";

    return NextResponse.json({ report });
  } catch (error: unknown) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
