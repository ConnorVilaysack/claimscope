import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const priceAmountCents = 499; // $4.99 per single report

export async function POST(request: NextRequest) {
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeKey);

  try {
    const { claimId } = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: priceAmountCents,
            product_data: {
              name: "ClaimScope Report Credit",
              description: "1 property damage inspection report",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        claimId: claimId || "",
        billingType: "single",
      },
      success_url: `${origin}/claims/${claimId}/inspection?payment=success`,
      cancel_url: `${origin}/claims/${claimId}/inspection?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
