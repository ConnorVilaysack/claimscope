"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Download,
  RefreshCw,
  Pencil,
  Check,
  Send,
  X,
  FileText,
  CreditCard,
} from "lucide-react";
import type { Claim, Report, Photo } from "@/lib/types";

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: claimId } = use(params);
  const supabase = createClient();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [editedText, setEditedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingDocx, setGeneratingDocx] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState("");
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [reportUnlocked, setReportUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  // Email state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [claimId]);

  // Generate a PDF preview so the on-screen view matches the downloaded file.
  useEffect(() => {
    if (!claim || !editedText) return;

    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    async function generatePreview() {
      setPdfError("");
      try {
        const res = await fetch("/api/ai/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportText: editedText,
            address: claim?.address || "",
            photos: photos.map((p) => ({ url: p.file_url, type: p.photo_type })),
            watermarkText:
              !isSubscriber && !reportUnlocked
                ? "PREVIEW ONLY - UNLOCK TO DOWNLOAD"
                : null,
          }),
        });

        if (!res.ok) throw new Error("Failed to generate PDF preview");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlToRevoke = url;

        if (!cancelled) {
          if (pdfUrl) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        if (!cancelled) setPdfError(e instanceof Error ? e.message : "Failed to generate PDF preview");
      }
    }

    generatePreview();

    return () => {
      cancelled = true;
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim?.id, editedText, photos.length, isSubscriber, reportUnlocked]);

  async function loadData() {
    try {
      const [claimRes, reportRes, photosRes, userRes] = await Promise.all([
        supabase.from("claims").select("*").eq("id", claimId).single(),
        supabase
          .from("reports")
          .select("*")
          .eq("claim_id", claimId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("photos")
          .select("*")
          .eq("claim_id", claimId)
          .order("created_at"),
        supabase.auth.getUser(),
      ]);

      if (claimRes.data) setClaim(claimRes.data);
      if (reportRes.data) {
        setReport(reportRes.data);
        setEditedText(reportRes.data.report_text);
        setReportUnlocked(Boolean(reportRes.data.access_unlocked));
      }
      if (photosRes.data) setPhotos(photosRes.data);

      if (userRes.data.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("report_credits,is_subscriber")
          .eq("id", userRes.data.user.id)
          .maybeSingle();
        if (profile) {
          setCredits(profile.report_credits ?? 0);
          setIsSubscriber(Boolean(profile.is_subscriber));
        }
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!report) return;
    setSaving(true);
    try {
      await supabase
        .from("reports")
        .update({ report_text: editedText })
        .eq("id", report.id);
      setReport({ ...report, report_text: editedText });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    if (!claim) return;
    setRegenerating(true);

    try {
      const photoAnalyses = photos
        .filter((p) => p.analysis)
        .map((p) => ({ ...p.analysis, photo_label: p.photo_type }));

      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyses: photoAnalyses,
          notes: claim.notes || "",
          address: claim.address,
        }),
      });

      if (res.ok) {
        const { report: newText } = await res.json();
        setEditedText(newText);

        if (report) {
          await supabase
            .from("reports")
            .update({ report_text: newText })
            .eq("id", report.id);
          setReport({ ...report, report_text: newText });
        }
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDownloadPdf() {
    const unlocked = await ensureReportUnlocked();
    if (!unlocked) return;

    setGeneratingPdf(true);
    try {
      // Use the same PDF the user is previewing when possible.
      const urlToDownload = pdfUrl;
      if (!urlToDownload) throw new Error("PDF not ready yet");

      const a = document.createElement("a");
      a.href = urlToDownload;
      a.download = `Inspection_Report_${claim?.address?.replace(/[^a-zA-Z0-9]/g, "_") || "report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGeneratingPdf(false);
    }
  }

  async function handleDownloadDocx() {
    const unlocked = await ensureReportUnlocked();
    if (!unlocked) return;

    setGeneratingDocx(true);
    try {
      const res = await fetch("/api/ai/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportText: editedText,
          address: claim?.address || "",
          photos: photos.map((p) => ({ url: p.file_url, type: p.photo_type })),
        }),
      });

      if (!res.ok) throw new Error("Failed to generate DOCX");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Inspection_Report_${claim?.address?.replace(/[^a-zA-Z0-9]/g, "_") || "report"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX export failed:", err);
    } finally {
      setGeneratingDocx(false);
    }
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailTo.trim()) return;

    setSendingEmail(true);
    setEmailError("");

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: emailTo.trim(),
          claimId,
        }),
      });

      if (res.ok) {
        setEmailSent(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSent(false);
          setEmailTo("");
        }, 2000);
      } else {
        const data = await res.json();
        setEmailError(data.error || "Failed to send email");
      }
    } catch {
      setEmailError("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  }

  async function ensureReportUnlocked() {
    if (reportUnlocked || isSubscriber) return true;
    setUnlocking(true);
    try {
      const res = await fetch("/api/reports/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });

      if (res.ok) {
        const data = await res.json();
        setReportUnlocked(true);
        if (typeof data.remainingCredits === "number") {
          setCredits(data.remainingCredits);
        }
        if (report) {
          setReport({ ...report, access_unlocked: true });
        }
        return true;
      }

      if (res.status === 402) {
        setShowPaywallModal(true);
        return false;
      }
      return false;
    } catch {
      return false;
    } finally {
      setUnlocking(false);
    }
  }

  async function handleBuyCredit() {
    const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE;
    if (paymentLink) {
      window.location.href = paymentLink;
      return;
    }
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  }

  async function handleSubscribe() {
    const link = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SUBSCRIPTION;
    if (link) {
      window.location.href = link;
      return;
    }
    const res = await fetch("/api/stripe/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
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
      <PageHeader
        title="Inspection Report"
        subtitle={claim?.address}
        showBack
        action={
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (isEditing) handleSave();
                else setIsEditing(true);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors"
            >
              {isEditing ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <Pencil className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>
        }
      />

      <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex-1"
          >
            {regenerating ? (
              <Spinner size="sm" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Regenerate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDownloadModal(true)}
            disabled={generatingPdf || generatingDocx || unlocking}
            className="flex-1"
          >
            {generatingPdf || generatingDocx || unlocking ? (
              <Spinner size="sm" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const unlocked = await ensureReportUnlocked();
              if (unlocked) setShowEmailModal(true);
            }}
            className="flex-1"
            disabled={unlocking}
          >
            <Send className="h-4 w-4" />
            Email
          </Button>
        </div>
        {!isSubscriber && !reportUnlocked && (
          <p className="text-xs text-muted-foreground">
            Preview is free. Download and email are unlocked when you use a report
            credit. Remaining free credits: {credits}
          </p>
        )}

        {/* Report content */}
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Pencil className="h-4 w-4" />
              Editing Report
            </div>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[60vh] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditedText(report?.report_text || "");
                  setIsEditing(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">PDF Preview</p>
              <p className="text-xs text-muted-foreground">
                This is exactly what downloads.
              </p>
            </div>
            {pdfError ? (
              <div className="p-4">
                <p className="text-sm text-destructive font-medium">{pdfError}</p>
              </div>
            ) : !pdfUrl ? (
              <div className="flex items-center justify-center p-10">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <iframe
                  title="Inspection PDF Preview"
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="w-full"
                  style={{ height: "70vh" }}
                />
              </>
            )}
          </div>
        )}

        {/* Photo evidence */}
        {photos.length > 0 && !isEditing && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Photo Evidence ({photos.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, i) => (
                <div key={photo.id} className="space-y-1">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl">
                    <img
                      src={photo.file_url}
                      alt={photo.photo_type}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center capitalize">
                    Photo {i + 1} — {photo.photo_type.replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Paywall modal */}
      {showPaywallModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowPaywallModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Unlock Export</h3>
              <button
                onClick={() => setShowPaywallModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Your report is ready</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Unlock download and email for this report with a single credit or
                subscribe for unlimited reports.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={handleBuyCredit}>
                Single Report - $4.99
              </Button>
              <Button onClick={handleSubscribe}>Unlimited - $49.99/mo</Button>
            </div>
          </div>
        </div>
      )}

      {/* Download options modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDownloadModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Download Report</h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose your preferred format.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={async () => {
                  setShowDownloadModal(false);
                  await handleDownloadPdf();
                }}
                disabled={generatingPdf || unlocking}
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  setShowDownloadModal(false);
                  await handleDownloadDocx();
                }}
                disabled={generatingDocx || unlocking}
              >
                <Download className="h-4 w-4" />
                Word (.docx)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowEmailModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Email Report</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {emailSent ? (
              <div className="text-center py-6 space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <p className="font-semibold">Report sent!</p>
                <p className="text-sm text-muted-foreground">
                  The PDF report has been emailed to {emailTo}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Recipient email address
                  </label>
                  <Input
                    type="email"
                    placeholder="adjuster@insurance.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The inspection report PDF for {claim?.address} will be
                  attached to the email.
                </p>
                {emailError && (
                  <p className="text-sm text-destructive font-medium">
                    {emailError}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <Spinner size="sm" className="text-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Report
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
