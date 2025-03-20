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
    const { templateId, email } = req.body

    if (!templateId || !email) {
      return res.status(400).json({ error: "Template ID and email are required" })
    }

    // Get the template
    const template = await EmailService.getTemplateById(templateId)
    if (!template) {
      return res.status(404).json({ error: "Template not found" })
    }

    // Generate test data based on template type
    const testData: Record<string, any> = {
      name: "Test User",
      email: email,
      date: new Date().toLocaleDateString(),
    }

    // Add type-specific test data
    if (template.type === "transaction") {
      testData.transactionId = "TEST-TRANS-12345"
      testData.amount = "99.99"
      testData.plan = "Premium Plan"
    } else if (template.type === "marketing") {
      testData.campaignId = "TEST-CAMPAIGN-12345"
      testData.featuredProduct = "Smart Home Security Camera"
      testData.featuredDescription = "This wireless camera offers 1080p HD video, motion detection, and night vision."
      testData.featuredLink = "https://winprod.ai/products/sample"
    } else if (template.type === "password_reset") {
      testData.resetLink = "https://winprod.ai/reset-password?token=sample-token-12345"
    }

    // Send the test email
    const success = await EmailService.sendEmail({
      to: email,
      templateId: template.id,
      data: testData,
    })

    if (success) {
      return res.status(200).json({ message: "Test email sent successfully" })
    } else {
      return res.status(500).json({ error: "Failed to send test email" })
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

