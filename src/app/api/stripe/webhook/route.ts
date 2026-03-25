import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function resolveUserIdFromStripe(
  stripe: Stripe,
  supabase: any,
  params: {
    userIdFromMetadata?: string;
    customerEmail?: string | null;
    customerId?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  }
): Promise<string | null> {
  if (params.userIdFromMetadata) return params.userIdFromMetadata;

  let email = params.customerEmail || null;

  if (!email && typeof params.customerId === "string") {
    const customer = await stripe.customers.retrieve(params.customerId);
    if ("email" in customer) {
      email = customer.email || null;
    }
  } else if (params.customerId && typeof params.customerId === "object") {
    if ("email" in params.customerId) {
      email = params.customerId.email || null;
    }
  }

  if (!email) return null;

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  const profile = data as { id: string } | null;
  return profile?.id || null;
}

export async function POST(request: NextRequest) {
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const billingType = session.metadata?.billingType;

    const userId = await resolveUserIdFromStripe(stripe, supabase, {
      userIdFromMetadata: session.metadata?.userId,
      customerEmail: session.customer_details?.email || session.customer_email,
      customerId: session.customer,
    });

    if (!userId) {
      console.error("Unable to resolve user for session:", {
        sessionId: session.id,
      });
      return NextResponse.json({ received: true });
    }

    if (billingType === "single" || session.mode === "payment") {
      await supabase.from("payments").insert({
        user_id: userId,
        stripe_session_id: session.id,
        amount_cents: session.amount_total || 499,
        credits: 1,
      });

      await supabase.rpc("increment_credits", { uid: userId });
    }

    if (billingType === "subscription" || session.mode === "subscription") {
      await supabase
        .from("users")
        .update({ is_subscriber: true })
        .eq("id", userId);
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = await resolveUserIdFromStripe(stripe, supabase, {
      userIdFromMetadata: subscription.metadata?.userId,
      customerId: subscription.customer,
    });
    if (userId) {
      await supabase
        .from("users")
        .update({
          is_subscriber: true,
          subscription_ends_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
        })
        .eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = await resolveUserIdFromStripe(stripe, supabase, {
      userIdFromMetadata: subscription.metadata?.userId,
      customerId: subscription.customer,
    });
    if (userId) {
      await supabase
        .from("users")
        .update({ is_subscriber: false })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}

