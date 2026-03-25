import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function imageUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/png";
  return `data:${contentType};base64,${base64}`;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const base64Url = await imageUrlToBase64(imageUrl);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a property damage inspector. Analyze the image and return ONLY valid JSON.

If the image is unclear or you are uncertain, still return best-effort values and use "unknown" for unknown fields. Never refuse. Never include any text outside JSON.

Return a JSON object with these fields:
- room_type: string (e.g., "kitchen", "bathroom", "bedroom", "living room", "exterior", "attic", "basement")
- damage_type: string (e.g., "water damage", "fire damage", "mold", "structural", "wind damage", "impact damage")
- materials_affected: string[] (e.g., ["drywall", "carpet", "wood flooring"])
- severity: "minor" | "moderate" | "severe" | "critical"
- description: string (2-3 sentences describing the visible damage)

Return ONLY the JSON object, no markdown formatting.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: base64Url, detail: "high" },
            },
            {
              type: "text",
              text: "Analyze this property damage photo.",
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();

    let analysis: any;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error("Model returned non-JSON:", text);
      analysis = {
        room_type: "unknown",
        damage_type: "unknown",
        materials_affected: [],
        severity: "moderate",
        description:
          "Unable to parse model output. Returning fallback analysis.",
      };
    }

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Image analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
