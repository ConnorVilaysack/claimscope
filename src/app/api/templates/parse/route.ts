import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "My Template";

    if (!file) {
      return NextResponse.json(
        { error: "PDF file is required" },
        { status: 400 }
      );
    }

    const storagePath = `${user.id}/${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("report-templates")
      .upload(storagePath, buffer, { contentType: file.type });

    if (uploadError) {
      console.error("Template upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("report-templates").getPublicUrl(storagePath);

    const pdfText = await extractTextFromPdf(buffer);

    const structure = await analyzeTemplateStructure(pdfText);

    const { data: template, error: insertError } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        name,
        original_file_url: publicUrl,
        structure,
        is_default: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Template insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Template parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse template" },
      { status: 500 }
    );
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const base64 = buffer.toString("base64");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Extract ALL text content from this PDF document. Preserve the structure — include headings, section titles, tables, field labels, and body text. Return the raw text content only, no commentary.",
      },
      {
        role: "user",
        content: [
          {
            type: "file",
            file: {
              filename: "report.pdf",
              file_data: `data:application/pdf;base64,${base64}`,
            },
          } as never,
          {
            type: "text",
            text: "Extract all text from this PDF, preserving the section structure and headings.",
          },
        ],
      },
    ],
    max_tokens: 8000,
  });

  return response.choices[0]?.message?.content || "";
}

async function analyzeTemplateStructure(
  pdfText: string
): Promise<{ sections: Array<{ heading: string; description: string; fields?: string[] }>; tone: string; formatting_notes: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at analyzing insurance inspection report templates. Given the text of a report, extract its structure so it can be used as a template for generating new reports.

Return a JSON object with this exact shape:
{
  "sections": [
    {
      "heading": "Section heading exactly as it appears",
      "description": "What this section contains and how it should be written (2-3 sentences)",
      "fields": ["field1", "field2"]  // optional — specific fields/labels used in this section
    }
  ],
  "tone": "A brief description of the writing tone and style (formal/technical/conversational, active/passive voice, etc.)",
  "formatting_notes": "Any notable formatting patterns: tables, bullet points, numbered lists, specific label formats, reference number styles, etc."
}

Important:
- Preserve the EXACT order of sections as they appear in the original report.
- Capture every distinct section, even small ones.
- For table-heavy sections, note the column headers in the fields array.
- Note any metadata/header fields (insurer name, ref numbers, property owner, etc.) as a section.
- Be specific in descriptions — an assessor should be able to recreate the report structure from your output alone.`,
      },
      {
        role: "user",
        content: `Analyze the structure of this insurance inspection report:\n\n${pdfText}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content || "{}";

  try {
    return JSON.parse(content);
  } catch {
    return {
      sections: [
        {
          heading: "Full Report",
          description: "Complete inspection report",
        },
      ],
      tone: "Professional and objective",
      formatting_notes: "Standard format",
    };
  }
}
