import { EmailService } from "../../src/lib/email-service"
import { defaultTemplates } from "../../src/lib/email-templates"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req: any, res: any) {
  // GET - Retrieve all templates or a specific template
  if (req.method === "GET") {
    try {
      const { id } = req.query

      if (id) {
        // Get a specific template
        const template = await EmailService.getTemplateById(id)
        if (!template) {
          return res.status(404).json({ error: "Template not found" })
        }
        return res.status(200).json(template)
      } else {
        // Get all templates
        const templates = await EmailService.getTemplates()
        return res.status(200).json(templates)
      }
    } catch (error) {
      console.error("Error retrieving email templates:", error)
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // POST - Create a new template
  else if (req.method === "POST") {
    try {
      const { name, type, subject, content, is_active } = req.body

      if (!name || !type || !subject || !content) {
        return res.status(400).json({ error: "Name, type, subject, and content are required" })
      }

      const template = await EmailService.createTemplate({
        name,
        type,
        subject,
        content,
        is_active: is_active !== undefined ? is_active : true,
      })

      return res.status(201).json(template)
    } catch (error) {
      console.error("Error creating email template:", error)
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // PUT - Update an existing template
  else if (req.method === "PUT") {
    try {
      const { id } = req.query
      const { name, type, subject, content, is_active } = req.body

      if (!id) {
        return res.status(400).json({ error: "Template ID is required" })
      }

      const template = await EmailService.updateTemplate(id, {
        name,
        type,
        subject,
        content,
        is_active,
      })

      return res.status(200).json(template)
    } catch (error) {
      console.error("Error updating email template:", error)
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // DELETE - Delete a template
  else if (req.method === "DELETE") {
    try {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ error: "Template ID is required" })
      }

      const success = await EmailService.deleteTemplate(id)

      if (success) {
        return res.status(200).json({ message: "Template deleted successfully" })
      } else {
        return res.status(500).json({ error: "Failed to delete template" })
      }
    } catch (error) {
      console.error("Error deleting email template:", error)
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // PATCH - Reset templates to defaults
  else if (req.method === "PATCH") {
    try {
      const { action } = req.body

      if (action === "reset") {
        console.log("Starting template reset process")

        // Delete all existing templates
        try {
          const { data: existingTemplates, error: fetchError } = await supabase.from("email_templates").select("id")

          if (fetchError) {
            console.error("Error fetching existing templates:", fetchError)
            throw fetchError
          }

          console.log(`Found ${existingTemplates?.length || 0} existing templates`)

          if (existingTemplates && existingTemplates.length > 0) {
            const { error: deleteError } = await supabase
              .from("email_templates")
              .delete()
              .in(
                "id",
                existingTemplates.map((t) => t.id),
              )

            if (deleteError) {
              console.error("Error deleting existing templates:", deleteError)
              throw deleteError
            }

            console.log("Successfully deleted existing templates")
          }
        } catch (error) {
          console.error("Error in delete operation:", error)
          return res.status(500).json({
            error: "Failed to delete existing templates",
            message: error instanceof Error ? error.message : "Unknown error",
          })
        }

        // Create default templates
        try {
          console.log("Creating default templates")
          const createdTemplates = await Promise.all(
            Object.values(defaultTemplates).map((template) => EmailService.createTemplate(template)),
          )

          console.log(`Successfully created ${createdTemplates.length} default templates`)

          return res.status(200).json({
            message: "Templates reset to defaults successfully",
            templates: createdTemplates,
          })
        } catch (error) {
          console.error("Error creating default templates:", error)
          return res.status(500).json({
            error: "Failed to create default templates",
            message: error instanceof Error ? error.message : "Unknown error",
          })
        }
      } else {
        return res.status(400).json({ error: "Invalid action" })
      }
    } catch (error) {
      console.error("Error resetting email templates:", error)
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // Method not allowed
  else {
    return res.status(405).json({ error: "Method not allowed" })
  }
}

