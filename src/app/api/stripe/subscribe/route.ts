import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const MONTHLY_PRICE_CENTS = 4999; // $49.99 monthly

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
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            unit_amount: MONTHLY_PRICE_CENTS,
            product_data: {
              name: "ClaimScope Unlimited Reports",
              description: "Unlimited inspection reports per month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        billingType: "subscription",
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/claims/${claimId || ""}/inspection?subscription=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe subscription checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription checkout" },
      { status: 500 }
    );
  }
}

