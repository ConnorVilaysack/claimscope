import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { claimId } = await request.json();
    if (!claimId) {
      return NextResponse.json({ error: "claimId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [{ data: claim }, { data: latestReport }, { data: profile }] =
      await Promise.all([
        supabase
          .from("claims")
          .select("id,user_id")
          .eq("id", claimId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("reports")
          .select("id,access_unlocked")
          .eq("claim_id", claimId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("users")
          .select("report_credits,is_subscriber")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    if (!claim || !latestReport || !profile) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (latestReport.access_unlocked) {
      return NextResponse.json({
        success: true,
        unlocked: true,
        remainingCredits: profile.report_credits,
        usedCredit: false,
      });
    }

    if (!profile.is_subscriber && profile.report_credits <= 0) {
      return NextResponse.json(
        { error: "Payment required", code: "PAYWALL_REQUIRED" },
        { status: 402 }
      );
    }

    if (!profile.is_subscriber) {
      await supabase.rpc("decrement_credits", { uid: user.id });
    }

    await supabase
      .from("reports")
      .update({ access_unlocked: true })
      .eq("id", latestReport.id);

    return NextResponse.json({
      success: true,
      unlocked: true,
      remainingCredits: profile.is_subscriber
        ? profile.report_credits
        : Math.max(profile.report_credits - 1, 0),
      usedCredit: !profile.is_subscriber,
    });
  } catch (error) {
    console.error("Report unlock error:", error);
    return NextResponse.json(
      { error: "Failed to unlock report" },
      { status: 500 }
    );
  }
}
