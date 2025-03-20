import { supabase } from "./supabase"

// Check if a user is an admin
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from("customers").select("subscription_tier").eq("user_id", userId).single()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    return data?.subscription_tier === "admin"
  } catch (error) {
    console.error("Error in checkIsAdmin:", error)
    return false
  }
}

// Update the Register page to send welcome email
export const sendWelcomeEmailAfterSignup = async (userId: string, email: string, fullName: string) => {
  try {
    // Import dynamically to avoid circular dependencies
    const { EmailService } = await import("./email-service")

    // Send welcome email
    await EmailService.sendWelcomeEmail(email, fullName || email.split("@")[0])

    return true
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return false
  }
}

// Update the payment handlers to send transaction emails
export const sendTransactionEmail = async (
  userId: string,
  email: string,
  amount: number,
  plan: string,
  transactionId: string,
) => {
  try {
    // Get user's name
    const { data: customer, error } = await supabase
      .from("customers")
      .select("full_name")
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching customer data:", error)
      return false
    }

    // Import dynamically to avoid circular dependencies
    const { EmailService } = await import("./email-service")

    // Send transaction email
    await EmailService.sendTransactionEmail(
      email,
      customer?.full_name || email.split("@")[0],
      amount,
      plan,
      transactionId,
    )

    return true
  } catch (error) {
    console.error("Error sending transaction email:", error)
    return false
  }
}


import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function truncateText(text: string, maxLength = 100): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}



