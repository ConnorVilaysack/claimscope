import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { reportText, address, photos, watermarkText } = await request.json();

    // Dynamic import to avoid SSR issues with react-pdf
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { createReportDocument } = await import("@/services/pdf");

    const doc = createReportDocument({
      reportText,
      address,
      photos,
      watermarkText: watermarkText || null,
    });
    const buffer = await renderToBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Inspection_Report.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
