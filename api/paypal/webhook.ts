import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"
import { sendTransactionEmail } from "../../src/lib/utils"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

// PayPal webhook verification
function verifyPayPalWebhook(body: string, paypalSignature: string, webhookId: string) {
  try {
    const transmissionId = paypalSignature.match(/transmissionId="([^"]+)"/)?.[1]
    const timestamp = paypalSignature.match(/timestamp="([^"]+)"/)?.[1]
    const webhookEvent = paypalSignature.match(/webhookId="([^"]+)"/)?.[1]
    const crcValue = paypalSignature.match(/crc32="([^"]+)"/)?.[1]

    if (!transmissionId || !timestamp || !webhookEvent || !crcValue || webhookEvent !== webhookId) {
      return false
    }

    // Verify CRC32
    const payload = `${transmissionId}|${timestamp}|${webhookId}|${crc32(body)}`
    const signature = crypto.createHmac("sha256", process.env.PAYPAL_WEBHOOK_SECRET!).update(payload).digest("hex")

    return signature === crcValue
  } catch (error) {
    console.error("Error verifying PayPal webhook:", error)
    return false
  }
}

function crc32(str: string): string {
  const table = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c
  }

  let crc = -1
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xff]
  }
  return (-1 ^ crc) >>> 0
}

async function handleSubscriptionActivated(event: any) {
  const subscriptionId = event.resource.id
  const customerId = event.resource.subscriber.payer_id
  const planId = event.resource.plan_id

  try {
    // Validate required fields
    if (!subscriptionId || !customerId || !planId) {
      throw new Error("Missing required subscription data")
    }

    // Get user_id from customers table using PayPal customer ID
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("user_id, email")
      .eq("paypal_customer_id", customerId)
      .single()

    if (customerError || !customer) {
      throw new Error("Customer not found")
    }

    // Begin transaction
    const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
      user_id: customer.user_id,
      paypal_subscription_id: subscriptionId,
      paypal_customer_id: customerId,
      plan_id: planId,
      status: "active",
      current_period_end: new Date(event.resource.billing_info.next_billing_time),
      updated_at: new Date(),
    })

    if (subscriptionError) throw subscriptionError

    // Update customer status
    const { error: customerUpdateError } = await supabase
      .from("customers")
      .update({
        subscription_status: "active",
        subscription_tier: "pro",
        updated_at: new Date(),
      })
      .eq("user_id", customer.user_id)

    if (customerUpdateError) throw customerUpdateError

    // Send transaction email
    if (customer.email) {
      // Extract amount from the event
      const amount = event.resource.billing_info?.last_payment?.amount?.value || 0

      await sendTransactionEmail(
        customer.user_id,
        customer.email,
        Number.parseFloat(amount),
        "Pro Plan",
        subscriptionId,
      )
    }
  } catch (error) {
    console.error("Error handling subscription activation:", error)
    throw error
  }
}

async function handleSubscriptionCancelled(event: any) {
  const subscriptionId = event.resource.id

  try {
    if (!subscriptionId) {
      throw new Error("Missing subscription ID")
    }

    // Get subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("paypal_subscription_id", subscriptionId)
      .single()

    if (subscriptionError || !subscription) {
      throw new Error("Subscription not found")
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date(),
        cancel_at: new Date(),
      })
      .eq("paypal_subscription_id", subscriptionId)

    if (updateError) throw updateError

    // Update customer subscription status
    const { error: customerError } = await supabase
      .from("customers")
      .update({
        subscription_status: "inactive",
        subscription_tier: "free",
        updated_at: new Date(),
      })
      .eq("user_id", subscription.user_id)

    if (customerError) throw customerError
  } catch (error) {
    console.error("Error handling subscription cancellation:", error)
    throw error
  }
}

async function handlePaymentCaptured(event: any) {
  const subscriptionId = event.resource.subscription_id
  const amount = event.resource.amount.value
  const currency = event.resource.amount.currency_code

  try {
    if (!subscriptionId || !amount || !currency) {
      throw new Error("Missing required payment data")
    }

    // Get subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("id, user_id")
      .eq("paypal_subscription_id", subscriptionId)
      .single()

    if (subscriptionError || !subscription) {
      throw new Error("Subscription not found")
    }

    // Record payment
    const { error: paymentError } = await supabase.from("payment_history").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount: Number.parseFloat(amount),
      currency: currency.toUpperCase(),
      status: "completed",
      payment_method: "paypal",
      created_at: new Date(),
    })

    if (paymentError) throw paymentError

    // Send transaction email
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("email")
      .eq("user_id", subscription.user_id)
      .single()

    if (!customerError && customer?.email) {
      await sendTransactionEmail(
        subscription.user_id,
        customer.email,
        Number.parseFloat(amount),
        "Pro Plan",
        event.resource.id,
      )
    }
  } catch (error) {
    console.error("Error handling payment capture:", error)
    throw error
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const paypalSignature = req.headers["paypal-transmission-sig"]
    const webhookId = process.env.PAYPAL_WEBHOOK_ID

    if (!paypalSignature || !webhookId) {
      return res.status(401).json({ error: "Missing PayPal signature or webhook ID" })
    }

    // Verify webhook signature
    const isValid = verifyPayPalWebhook(JSON.stringify(req.body), paypalSignature, webhookId)
    if (!isValid) {
      return res.status(401).json({ error: "Invalid webhook signature" })
    }

    const event = req.body

    // Validate event structure
    if (!event.event_type || !event.resource) {
      return res.status(400).json({ error: "Invalid event format" })
    }

    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(event)
        break
      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(event)
        break
      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePaymentCaptured(event)
        break
      default:
        // Log unhandled event types for monitoring
        console.log("Unhandled PayPal webhook event:", event.event_type)
        break
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error("Error processing PayPal webhook:", error)
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

