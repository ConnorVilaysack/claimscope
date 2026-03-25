import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resendKey = process.env.RESEND_API_KEY;

export async function POST(request: NextRequest) {
  if (!resendKey) {
    return NextResponse.json(
      { error: "Email service is not configured" },
      { status: 503 }
    );
  }

  const resend = new Resend(resendKey);

  try {
    const { recipientEmail, claimId } = await request.json();

    if (!recipientEmail || !claimId) {
      return NextResponse.json(
        { error: "recipientEmail and claimId are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [claimRes, reportRes, photosRes, profileRes] = await Promise.all([
      supabase.from("claims").select("*").eq("id", claimId).single(),
      supabase
        .from("reports")
        .select("*")
        .eq("claim_id", claimId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("photos").select("*").eq("claim_id", claimId).order("created_at"),
      supabase
        .from("users")
        .select("is_subscriber")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    if (!reportRes.data || !claimRes.data) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const isSubscriber = Boolean(profileRes.data?.is_subscriber);
    if (!isSubscriber && !reportRes.data.access_unlocked) {
      return NextResponse.json(
        { error: "Unlock this report before emailing", code: "PAYWALL_REQUIRED" },
        { status: 402 }
      );
    }

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { createReportDocument } = await import("@/services/pdf");

    const doc = createReportDocument({
      reportText: reportRes.data.report_text,
      address: claimRes.data.address,
      photos: (photosRes.data || []).map(
        (p: { file_url: string; photo_type: string }) => ({
          url: p.file_url,
          type: p.photo_type,
        })
      ),
    });

    const buffer = await renderToBuffer(doc);
    const pdfBase64 = Buffer.from(buffer).toString("base64");

    const address = claimRes.data.address;
    const safeAddress = address.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 40);

    await resend.emails.send({
      from: "Inspection Reports <reports@claimscope.app>",
      to: [recipientEmail],
      subject: `Inspection Report — ${address}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Inspection Report</h2>
          <p>Please find attached the property damage inspection report for:</p>
          <p style="font-weight: bold; font-size: 16px;">${address}</p>
          <p style="color: #64748b; font-size: 14px;">
            Please review the attached PDF for full details.
          </p>
          <hr style="border: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            Sent from your inspection workspace
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Inspection_Report_${safeAddress}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
