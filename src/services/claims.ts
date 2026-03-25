import { createClient } from "@/lib/supabase/client";
import type { Claim, Photo, Report } from "@/lib/types";

function db() {
  return createClient();
}

export async function getClaims(): Promise<Claim[]> {
  const { data, error } = await db()
    .from("claims")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getClaim(id: string): Promise<Claim> {
  const { data, error } = await db()
    .from("claims")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createClaim(address: string, notes?: string): Promise<Claim> {
  const supabase = db();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("claims")
    .insert({ user_id: user.id, address, notes, status: "draft" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClaimStatus(id: string, status: string): Promise<void> {
  const { error } = await db()
    .from("claims")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function updateClaimNotes(id: string, notes: string): Promise<void> {
  const { error } = await db()
    .from("claims")
    .update({ notes })
    .eq("id", id);
  if (error) throw error;
}

export async function getPhotos(claimId: string): Promise<Photo[]> {
  const { data, error } = await db()
    .from("photos")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function uploadPhoto(
  claimId: string,
  photoType: string,
  file: File
): Promise<Photo> {
  const supabase = db();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${claimId}/${photoType}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("claim-photos")
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("claim-photos")
    .getPublicUrl(path);

  const { data, error } = await supabase
    .from("photos")
    .insert({ claim_id: claimId, photo_type: photoType, file_url: publicUrl })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getReport(claimId: string): Promise<Report | null> {
  const { data, error } = await db()
    .from("reports")
    .select("*")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveReport(
  claimId: string,
  reportText: string,
  pdfUrl?: string
): Promise<Report> {
  const supabase = db();
  const existing = await getReport(claimId);

  if (existing) {
    const { data, error } = await supabase
      .from("reports")
      .update({ report_text: reportText, pdf_url: pdfUrl || existing.pdf_url })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({ claim_id: claimId, report_text: reportText, pdf_url: pdfUrl })
    .select()
    .single();
  if (error) throw error;
  return data;
}
