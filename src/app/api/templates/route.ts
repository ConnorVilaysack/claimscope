import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_TEMPLATES = [
  {
    name: "ClaimScope Standard",
    is_default: true,
    structure: {
      sections: [
        { heading: "Executive Summary", description: "Concise 2-3 sentence overview of primary damage type, overall severity, and recommended course of action." },
        { heading: "Property Details", description: "Address, inspection date, report reference, assessment method.", fields: ["Address", "Inspection Date", "Report Reference", "Assessment Method"] },
        { heading: "Damage Assessment Summary", description: "Markdown table summarizing all damage found.", fields: ["Area", "Damage Type", "Severity", "Key Materials"] },
        { heading: "Detailed Findings", description: "For each affected area: location/extent, type/cause, materials affected, photo references." },
        { heading: "Recommended Scope of Works", description: "Itemized list of repairs with description, estimated scope, and priority (Urgent/Standard/Low)." },
        { heading: "Materials Schedule", description: "Bulleted list of all materials requiring replacement or repair, grouped by area." },
        { heading: "Additional Notes", description: "Inspector notes if provided." },
      ],
      tone: "Professional, objective, specific. Uses metric measurements. Avoids vague language.",
      formatting_notes: "Markdown format. Uses tables for damage summary. Numbered headings. Photo references (e.g., 'See Photo 1').",
    },
  },
  {
    name: "QAT Format",
    is_default: true,
    structure: {
      sections: [
        { heading: "Inspection Report", description: "Header with insurer details, reference numbers, property owner, assessor, and property address.", fields: ["Insurer", "QAT Ref #", "Insurer Ref #", "Property Owner", "Assessor", "Property Address", "Inspected By", "Inspector Contact"] },
        { heading: "Policy Recommendation", description: "Top-level recommendation (Accept/Decline/Unsure) with a note to review the Conclusion section." },
        { heading: "Claim Information", description: "Claimed event type, building and contents sum insured, adequacy assessment.", fields: ["Claimed Event Type", "Building Sum Insured", "Contents Sum Insured", "Is the sum insured adequate?"] },
        { heading: "Attendance Details", description: "Inspector name, inspection date/time, site contact, roof inspection status, type of inspection.", fields: ["Inspected By", "Inspection Date", "Inspection Time", "Site Contact", "Roof Inspection Required?", "Type of Inspection"] },
        { heading: "Property Details", description: "Condition, building type, description, levels, cladding types, internal linings, outbuildings, construction age, years owned, building use.", fields: ["Condition of Property", "Building Type", "Building Description", "# of Levels", "Wall Cladding Type", "Roof Cladding Type", "Internal Wall Linings", "Out Buildings", "Construction Age Bracket", "Years Owned by Insured", "Building Use"] },
        { heading: "Claim/Incident Details", description: "Whether assessor/engineer is required, property category.", fields: ["Assessor Required", "Engineer Required", "Property Category"] },
        { heading: "Circumstances of Loss", description: "Client discussion notes summarizing what the insured reported about the incident." },
        { heading: "Inspection Observations", description: "Detailed findings from external, internal, and roof inspections. Structured by elevation/area." },
        { heading: "Damage", description: "Whether damage is consistent with claimed event, details of damages observed onsite.", fields: ["Is the damage consistent with the claimed event?", "Details of damages observed onsite"] },
        { heading: "Cause of Damage", description: "Causation findings, single event vs period of time, timeframe estimate, defects/maintenance contribution, weather data.", fields: ["Causation Findings", "Has the damage occurred over a period of time or from a single event?", "Timeframe of Damage", "Weather Data"] },
        { heading: "Maintenance/Repairs Required by Owner", description: "Specific maintenance actions required before claim repairs can proceed." },
        { heading: "Conclusion", description: "Policy recommendation with reasoning, citing relevant PDS general exclusions. Repair warrantability assessment." },
        { heading: "Make Safe Works Required", description: "Emergency works completed or required to prevent further damage." },
        { heading: "Photo Schedule", description: "Floor plans/mud maps followed by captioned site photos organized by area/damage type." },
      ],
      tone: "Formal, technical, third-person. Uses passive voice for observations. Direct statements for recommendations.",
      formatting_notes: "Field-label format (Label: Value). Sections separated clearly. Photo captions beneath images. Tables for structured data. References to PDS clauses in conclusion.",
    },
  },
  {
    name: "Crawford & Company",
    is_default: true,
    structure: {
      sections: [
        { heading: "Report Header", description: "Company logo area, claim reference, insurer, insured name, loss date, report date.", fields: ["Claim Reference", "Insurer", "Insured", "Loss Date", "Report Date", "Adjuster"] },
        { heading: "Summary of Loss", description: "Brief paragraph summarizing the loss event, location, and primary damage." },
        { heading: "Background", description: "Policy details, coverage type, sum insured, excess/deductible." },
        { heading: "Investigation", description: "Chronology of events, site attendance details, persons interviewed." },
        { heading: "Property Description", description: "Building construction, age, condition, number of storeys, roof type." },
        { heading: "Damage Description", description: "Detailed room-by-room or area-by-area damage description with photo references." },
        { heading: "Cause and Origin", description: "Analysis of the cause of damage, contributing factors, and whether it falls within policy coverage." },
        { heading: "Quantum / Scope of Repairs", description: "Costed scope of works with line items, quantities, and rates where possible.", fields: ["Item", "Description", "Quantity", "Rate", "Amount"] },
        { heading: "Liability Assessment", description: "Coverage analysis and recommendation on policy response." },
        { heading: "Recommendation", description: "Clear recommendation to insurer on claim settlement." },
        { heading: "Photographic Evidence", description: "Numbered photos with captions and damage annotations." },
      ],
      tone: "Formal, analytical. Uses third-person throughout. Measured and balanced language for liability sections.",
      formatting_notes: "Numbered sections and sub-sections. Costed tables for scope of works. Photos numbered sequentially with descriptive captions.",
    },
  },
  {
    name: "Sedgwick",
    is_default: true,
    structure: {
      sections: [
        { heading: "Claim Summary", description: "One-page overview with key claim details, loss summary, and recommendation.", fields: ["Claim Number", "Policy Number", "Insured", "Date of Loss", "Date of Inspection", "Adjuster", "Status"] },
        { heading: "Insured Details", description: "Full insured details, property address, contact information." },
        { heading: "Policy Information", description: "Policy type, period, sum insured, excess, relevant endorsements." },
        { heading: "Circumstances of Loss", description: "Detailed account of the loss event as reported by the insured." },
        { heading: "Site Inspection Findings", description: "Structured observations by area/room with damage descriptions and severity ratings." },
        { heading: "Causation Analysis", description: "Professional opinion on the cause of damage, distinguishing between insured perils and excluded causes." },
        { heading: "Indemnity Assessment", description: "Policy coverage analysis, applicable exclusions, and indemnity position." },
        { heading: "Repair Methodology & Costings", description: "Recommended repair methodology with estimated costings.", fields: ["Trade", "Description", "Cost Estimate"] },
        { heading: "Reserve Recommendation", description: "Recommended reserve amount and breakdown." },
        { heading: "Appendix — Photographs", description: "Categorized photo evidence with damage annotations and captions." },
      ],
      tone: "Professional, analytical, and precise. Uses formal insurance terminology. Objective assessments with clear reasoning.",
      formatting_notes: "Structured with numbered sections. Uses summary tables. Cost estimates in tabular format. Photos in appendix with cross-references in body.",
    },
  },
  {
    name: "IAG / CGU",
    is_default: true,
    structure: {
      sections: [
        { heading: "Assessment Report", description: "Cover page with insurer branding, claim number, insured name, and assessor details.", fields: ["Claim Number", "Insured Name", "Property Address", "Date of Loss", "Date of Assessment", "Assessor Name"] },
        { heading: "Executive Summary", description: "Brief summary of the claim, key findings, and recommendation in 3-4 sentences." },
        { heading: "Claim Details", description: "Event details, reported cause, policy type, sum insured.", fields: ["Event Type", "Reported Cause", "Policy Type", "Building Sum Insured", "Contents Sum Insured"] },
        { heading: "Property Overview", description: "Construction type, age, condition assessment, building description." },
        { heading: "Assessment Findings", description: "Room-by-room or area-by-area damage assessment with severity classification (Minor/Moderate/Major/Catastrophic)." },
        { heading: "Causation", description: "Determination of the proximate cause and whether it is an insured peril under the PDS." },
        { heading: "Scope of Works", description: "Detailed scope of required repairs with trade breakdowns.", fields: ["Trade", "Scope Description", "Priority"] },
        { heading: "Estimate of Costs", description: "Cost estimate for all required works, including GST.", fields: ["Item", "Description", "Ex GST", "GST", "Inc GST"] },
        { heading: "Recommendation", description: "Assessor recommendation on claim response — approve, decline, or refer." },
        { heading: "Supporting Photographs", description: "Photographic evidence organized by location/damage type with clear captions." },
      ],
      tone: "Clear, professional, and concise. Uses IAG-standard terminology. Active voice for recommendations, passive for observations.",
      formatting_notes: "Numbered sections. Cost tables with GST breakdown. Severity classifications used consistently. Photos with location labels and damage type annotations.",
    },
  },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userTemplates, error } = await supabase
      .from("templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Templates fetch error:", error);
    }

    const templates = [
      ...DEFAULT_TEMPLATES.map((t, i) => ({
        id: `default-${i}`,
        user_id: user.id,
        original_file_url: null,
        created_at: new Date().toISOString(),
        ...t,
      })),
      ...(userTemplates || []),
    ];

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Templates list error:", error);
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id || (id as string).startsWith("default-")) {
      return NextResponse.json(
        { error: "Cannot delete default templates" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
