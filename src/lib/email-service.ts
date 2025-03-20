import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Email types
export type EmailType = "welcome" | "transaction" | "marketing" | "password_reset"

// Email template interface
export interface EmailTemplate {
  id: string
  name: string
  type: EmailType
  subject: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Email data interface
export interface EmailData {
  to: string
  subject?: string
  templateId: string
  data?: Record<string, any>
}

/**
 * Email service for sending various types of emails
 */
export class EmailService {
  /**
   * Get all email templates
   */
  static async getTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase.from("email_templates").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching email templates:", error)
      throw error
    }

    return data || []
  }

  /**
   * Get a specific email template by ID
   */
  static async getTemplateById(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase.from("email_templates").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching email template with ID ${id}:`, error)
      return null
    }

    return data
  }

  /**
   * Get a specific email template by type
   */
  static async getTemplateByType(type: EmailType): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", type)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error(`Error fetching email template of type ${type}:`, error)
      return null
    }

    return data
  }

  /**
   * Create a new email template
   */
  static async createTemplate(
    template: Omit<EmailTemplate, "id" | "created_at" | "updated_at">,
  ): Promise<EmailTemplate | null> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("email_templates")
      .insert([
        {
          ...template,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating email template:", error)
      throw error
    }

    return data
  }

  /**
   * Update an existing email template
   */
  static async updateTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from("email_templates")
      .update({
        ...template,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating email template with ID ${id}:`, error)
      throw error
    }

    return data
  }

  /**
   * Delete an email template
   */
  static async deleteTemplate(id: string): Promise<boolean> {
    const { error } = await supabase.from("email_templates").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting email template with ID ${id}:`, error)
      throw error
    }

    return true
  }

  /**
   * Send an email using the specified template
   */
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Get the template
      const template = await this.getTemplateById(emailData.templateId)
      if (!template) {
        throw new Error(`Template with ID ${emailData.templateId} not found`)
      }

      // Replace placeholders in the template with actual data
      let content = template.content
      let subject = emailData.subject || template.subject

      if (emailData.data) {
        // Replace placeholders in content
        Object.entries(emailData.data).forEach(([key, value]) => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
          content = content.replace(regex, String(value))
          subject = subject.replace(regex, String(value))
        })
      }

      // For now, we'll just log the email since we don't have an actual email service integrated
      console.log("Sending email:", {
        to: emailData.to,
        subject,
        content,
      })

      // Log the email send in the database
      const { error } = await supabase.from("email_logs").insert([
        {
          email: emailData.to,
          template_id: emailData.templateId,
          status: "sent",
          metadata: emailData.data || {},
          sent_at: new Date().toISOString(),
        },
      ])

      if (error) {
        console.error("Error logging email send:", error)
      }

      // In a real implementation, you would call your email service provider here
      // For example, with SendGrid:
      // await sendgrid.send({
      //   to: emailData.to,
      //   from: 'your-email@example.com',
      //   subject,
      //   html: content,
      // });

      return true
    } catch (error) {
      console.error("Error sending email:", error)
      return false
    }
  }

  /**
   * Send a welcome email to a new user
   */
  static async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      const template = await this.getTemplateByType("welcome")
      if (!template) {
        console.error("No active welcome email template found")
        return false
      }

      return await this.sendEmail({
        to: email,
        templateId: template.id,
        data: {
          name,
          email,
          date: new Date().toLocaleDateString(),
        },
      })
    } catch (error) {
      console.error("Error sending welcome email:", error)
      return false
    }
  }

  /**
   * Send a transaction confirmation email
   */
  static async sendTransactionEmail(
    email: string,
    name: string,
    amount: number,
    plan: string,
    transactionId: string,
  ): Promise<boolean> {
    try {
      const template = await this.getTemplateByType("transaction")
      if (!template) {
        console.error("No active transaction email template found")
        return false
      }

      return await this.sendEmail({
        to: email,
        templateId: template.id,
        data: {
          name,
          email,
          amount: amount.toFixed(2),
          plan,
          transactionId,
          date: new Date().toLocaleDateString(),
        },
      })
    } catch (error) {
      console.error("Error sending transaction email:", error)
      return false
    }
  }

  /**
   * Send a marketing email
   */
  static async sendMarketingEmail(
    email: string,
    name: string,
    campaignId: string,
    customData?: Record<string, any>,
  ): Promise<boolean> {
    try {
      const template = await this.getTemplateByType("marketing")
      if (!template) {
        console.error("No active marketing email template found")
        return false
      }

      return await this.sendEmail({
        to: email,
        templateId: template.id,
        data: {
          name,
          email,
          campaignId,
          date: new Date().toLocaleDateString(),
          ...customData,
        },
      })
    } catch (error) {
      console.error("Error sending marketing email:", error)
      return false
    }
  }
}

