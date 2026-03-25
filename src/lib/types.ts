export type ClaimStatus = "draft" | "inspecting" | "analyzing" | "report_ready" | "completed";

export const PHOTO_TAGS = [
  { value: "general", label: "General" },
  { value: "room_overview", label: "Room Overview" },
  { value: "damage_area", label: "Damage Area" },
  { value: "damage_closeup", label: "Close-up" },
  { value: "damage_source", label: "Damage Source" },
  { value: "exterior", label: "Exterior" },
] as const;

export type PhotoTag = (typeof PHOTO_TAGS)[number]["value"];

export interface User {
  id: string;
  email: string;
  report_credits: number;
  is_subscriber: boolean;
  subscription_ends_at: string | null;
  created_at: string;
}

export interface Claim {
  id: string;
  user_id: string;
  address: string;
  notes: string | null;
  status: ClaimStatus;
  created_at: string;
}

export interface Photo {
  id: string;
  claim_id: string;
  photo_type: string;
  file_url: string;
  analysis: ImageAnalysis | null;
  created_at: string;
}

export interface Report {
  id: string;
  claim_id: string;
  report_text: string;
  pdf_url: string | null;
  access_unlocked?: boolean;
  created_at: string;
}

export interface ImageAnalysis {
  room_type: string;
  damage_type: string;
  materials_affected: string[];
  severity: "minor" | "moderate" | "severe" | "critical";
  description: string;
}

export interface TemplateSection {
  heading: string;
  description: string;
  fields?: string[];
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  original_file_url: string | null;
  structure: {
    sections: TemplateSection[];
    tone: string;
    formatting_notes: string;
  };
  is_default: boolean;
  created_at: string;
}

export const DEFAULT_TEMPLATE_NAMES = [
  "ClaimScope Standard",
  "QAT Format",
  "Crawford & Company",
  "Sedgwick",
  "IAG / CGU",
] as const;
