import { buffer } from "micro"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { sendTransactionEmail } from "../../src/lib/utils"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export const config = {
  api: {
    bodyParser: false,
  },
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Get customer from Stripe
  const customer = await stripe.customers.retrieve(customerId)
  const userId = customer.metadata.userId

  // Update subscription in database
  await supabase.from("subscriptions").insert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    plan_id: subscription.items.data[0].price.id,
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000),
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
  })

  // Update customer subscription status
  await supabase
    .from("customers")
    .update({
      subscription_status: "active",
      subscription_tier: "pro",
    })
    .eq("user_id", userId)

  // Send transaction email
  if (customer.email) {
    const amount = subscription.items.data[0].price.unit_amount! / 100 // Convert from cents
    await sendTransactionEmail(userId, customer.email, amount, "Pro Plan", subscription.id)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Update subscription in database
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    })
    .eq("stripe_subscription_id", subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Get customer from database
  const { data: customer } = await supabase
    .from("customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (customer) {
    // Update customer subscription status
    await supabase
      .from("customers")
      .update({
        subscription_status: "inactive",
        subscription_tier: "free",
      })
      .eq("user_id", customer.user_id)

    // Update subscription status
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
      })
      .eq("stripe_subscription_id", subscription.id)
  }
}

async function handlePaymentSucceeded(charge: Stripe.Charge) {
  const customerId = charge.customer as string

  // Get customer from database
  const { data: customer } = await supabase
    .from("customers")
    .select("user_id, subscriptions!inner(id)")
    .eq("stripe_customer_id", customerId)
    .single()

  if (customer) {
    // Record payment in history
    await supabase.from("payment_history").insert({
      user_id: customer.user_id,
      subscription_id: customer.subscriptions.id,
      amount: charge.amount / 100, // Convert from cents
      currency: charge.currency.toUpperCase(),
      status: charge.status,
      payment_method: charge.payment_method_details?.type || "unknown",
    })

    // Send transaction email
    const { data: userData } = await supabase.from("customers").select("email").eq("user_id", customer.user_id).single()

    if (userData?.email) {
      await sendTransactionEmail(customer.user_id, userData.email, charge.amount / 100, "Pro Plan", charge.id)
    }
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const buf = await buffer(req)
  const sig = req.headers["stripe-signature"]

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return res.status(400).json({ error: "Webhook signature verification failed" })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case "charge.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Charge)
        break
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

