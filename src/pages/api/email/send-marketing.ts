import { EmailService } from "../../src/lib/email-service"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { campaignId, recipients, customData } = req.body

    if (!campaignId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "Campaign ID and recipients array are required" })
    }

    // Get campaign details from the database
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: "Campaign not found" })
    }

    // Send emails to all recipients
    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const { email, name } = recipient

        if (!email) {
          return { email, success: false, error: "Email is required" }
        }

        try {
          const success = await EmailService.sendMarketingEmail(
            email,
            name || "Valued Customer",
            campaignId,
            customData,
          )

          return { email, success }
        } catch (error) {
          return {
            email,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }),
    )

    // Update campaign stats
    const successCount = results.filter((r) => r.success).length

    await supabase
      .from("email_campaigns")
      .update({
        recipient_count: campaign.recipient_count + recipients.length,
        status: "completed",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)

    return res.status(200).json({
      message: `Marketing emails sent to ${successCount} out of ${recipients.length} recipients`,
      results,
    })
  } catch (error) {
    console.error("Error sending marketing emails:", error)
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

