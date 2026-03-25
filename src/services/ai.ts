import type { ImageAnalysis } from "@/lib/types";

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to analyze image");
  }
  return res.json();
}

export async function transcribeVoiceNote(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const res = await fetch("/api/ai/transcribe", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to transcribe");
  }
  const data = await res.json();
  return data.text;
}

export async function generateInspectionReport(
  analyses: ImageAnalysis[],
  notes: string,
  address: string
): Promise<string> {
  const res = await fetch("/api/ai/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analyses, notes, address }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to generate report");
  }
  const data = await res.json();
  return data.report;
}

export function aggregateDamageData(analyses: ImageAnalysis[]) {
  const allMaterials = new Set<string>();
  const damageTypes = new Set<string>();
  const roomTypes = new Set<string>();
  let maxSeverity: ImageAnalysis["severity"] = "minor";

  const severityOrder = { minor: 0, moderate: 1, severe: 2, critical: 3 };

  for (const a of analyses) {
    a.materials_affected.forEach((m) => allMaterials.add(m));
    damageTypes.add(a.damage_type);
    roomTypes.add(a.room_type);
    if (severityOrder[a.severity] > severityOrder[maxSeverity]) {
      maxSeverity = a.severity;
    }
  }

  return {
    materials: Array.from(allMaterials),
    damageTypes: Array.from(damageTypes),
    roomTypes: Array.from(roomTypes),
    overallSeverity: maxSeverity,
    photoCount: analyses.length,
  };
}
