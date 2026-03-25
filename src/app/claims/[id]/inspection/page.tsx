"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PHOTO_TAGS, type Claim, type Photo, type Template } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { VoiceRecorder } from "@/components/voice-recorder";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Camera,
  X,
  Sparkles,
  FileText,
  ImagePlus,
  ChevronDown,
} from "lucide-react";

export default function InspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: claimId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [claim, setClaim] = useState<Claim | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default-0");

  useEffect(() => {
    loadData();
    loadTemplates();
  }, [claimId]);

  async function loadData() {
    try {
      const [claimRes, photosRes] = await Promise.all([
        supabase.from("claims").select("*").eq("id", claimId).single(),
        supabase.from("photos").select("*").eq("claim_id", claimId).order("created_at"),
      ]);

      if (claimRes.data) {
        setClaim(claimRes.data);
        setNotes(claimRes.data.notes || "");
      }
      if (photosRes.data) setPhotos(photosRes.data);

    } catch {
      // handle gracefully
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const { templates: data } = await res.json();
        setTemplates(data);
      }
    } catch {
      // templates are optional
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${claimId}/photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("claim-photos")
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("claim-photos").getPublicUrl(path);

        const { data: photo, error } = await supabase
          .from("photos")
          .insert({
            claim_id: claimId,
            photo_type: "general",
            file_url: publicUrl,
          })
          .select()
          .single();

        if (!error && photo) {
          setPhotos((prev) => [...prev, photo]);
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeletePhoto(photoId: string, fileUrl: string) {
    const urlParts = fileUrl.split("/claim-photos/");
    const storagePath = urlParts[1];

    await Promise.all([
      supabase.from("photos").delete().eq("id", photoId),
      storagePath
        ? supabase.storage.from("claim-photos").remove([storagePath])
        : Promise.resolve(),
    ]);

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  async function handleTagChange(photoId: string, tag: string) {
    await supabase.from("photos").update({ photo_type: tag }).eq("id", photoId);
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, photo_type: tag } : p))
    );
  }

  async function handleVoiceTranscription(text: string) {
    const updated = notes ? `${notes}\n${text}` : text;
    setNotes(updated);
    await supabase.from("claims").update({ notes: updated }).eq("id", claimId);
  }

  async function handleSaveNotes() {
    await supabase.from("claims").update({ notes }).eq("id", claimId);
  }

  async function handleGenerateReport() {
    if (photos.length === 0) return;

    setAnalyzing(true);
    setAnalyzeProgress({ current: 0, total: photos.length });

    try {
      const photoAnalyses = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setAnalyzeProgress({ current: i + 1, total: photos.length });

        if (!photo.analysis) {
          const res = await fetch("/api/ai/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: photo.file_url }),
          });

          if (res.ok) {
            const analysis = await res.json();
            await supabase
              .from("photos")
              .update({ analysis })
              .eq("id", photo.id);
            photoAnalyses.push({ ...analysis, photo_label: photo.photo_type });
          }
        } else {
          photoAnalyses.push({ ...photo.analysis, photo_label: photo.photo_type });
        }
      }

      const selectedTemplate = templates.find(
        (t) => t.id === selectedTemplateId
      );

      const reportRes = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyses: photoAnalyses,
          notes,
          address: claim?.address || "",
          templateStructure: selectedTemplate?.structure || null,
          templateName: selectedTemplate?.name || null,
        }),
      });

      if (reportRes.ok) {
        const { report } = await reportRes.json();

        await supabase
          .from("reports")
          .insert({ claim_id: claimId, report_text: report });

        await supabase
          .from("claims")
          .update({ status: "report_ready" })
          .eq("id", claimId);

        router.push(`/claims/${claimId}/report`);
      }
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-6">
      <PageHeader title="Inspection" subtitle={claim?.address} showBack />

      <main className="mx-auto max-w-lg px-4 py-4 space-y-6">
        {/* Photo upload section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Camera className="h-4 w-4 text-primary" />
              Photos ({photos.length})
            </label>
            {photos.length > 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                + Add more
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="space-y-1">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted group">
                  <img
                    src={photo.file_url}
                    alt={photo.photo_type}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id, photo.file_url)}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <select
                  value={photo.photo_type}
                  onChange={(e) => handleTagChange(photo.id, e.target.value)}
                  className="w-full text-[11px] text-muted-foreground bg-transparent border-0 p-0 text-center focus:outline-none cursor-pointer"
                >
                  {PHOTO_TAGS.map((tag) => (
                    <option key={tag.value} value={tag.value}>
                      {tag.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Add photo button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-50"
            >
              {uploading ? (
                <Spinner size="sm" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-[11px] font-medium text-muted-foreground">
                {uploading ? "Uploading..." : photos.length === 0 ? "Add Photos" : "Add"}
              </span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Notes section */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            Inspection Notes
          </label>
          <VoiceRecorder onTranscription={handleVoiceTranscription} />
          <Textarea
            placeholder="Describe the damage, affected areas, possible causes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            rows={4}
          />
        </div>

        {/* Template selection */}
        {templates.length > 0 && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Report Template
            </label>
            <div className="relative">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-white px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.is_default ? "" : " (Custom)"}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-xs text-muted-foreground">
              {templates.find((t) => t.id === selectedTemplateId)?.structure
                ?.sections?.length || 0}{" "}
              sections &middot;{" "}
              {templates.find((t) => t.id === selectedTemplateId)?.is_default
                ? "Built-in template"
                : "Custom template from your uploaded report"}
            </p>
          </div>
        )}

        {/* Generate section */}
        <Button
          size="xl"
          className="w-full"
          onClick={handleGenerateReport}
          disabled={photos.length === 0 || analyzing}
        >
          {analyzing ? (
            <>
              <Spinner size="sm" className="text-white" />
              Analyzing {analyzeProgress.current}/{analyzeProgress.total}...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Report
            </>
          )}
        </Button>

        {analyzing && (
          <div className="rounded-2xl bg-primary/5 p-4 text-center">
            <p className="text-sm font-medium text-primary">
              Analyzing your photos and generating the report...
            </p>
            <div className="mt-3 h-2 rounded-full bg-primary/20 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${analyzeProgress.total > 0
                    ? (analyzeProgress.current / analyzeProgress.total) * 100
                    : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Photo {analyzeProgress.current} of {analyzeProgress.total}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
