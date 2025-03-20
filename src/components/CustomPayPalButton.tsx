"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "../lib/supabase"

interface CustomPayPalButtonProps {
  interval: "monthly" | "yearly"
  onSuccess: () => void
  onError: (error: Error) => void
  disabled?: boolean
}

const CustomPayPalButton: React.FC<CustomPayPalButtonProps> = ({ interval, onSuccess, onError, disabled = false }) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayPalClick = async () => {
    try {
      setIsProcessing(true)

      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("User not authenticated")
      }

      // Redirect to PayPal checkout
      window.location.href = `/api/paypal/create-checkout-session?interval=${interval}&userId=${userData.user.id}`
    } catch (error) {
      console.error("PayPal checkout error:", error)
      onError(error instanceof Error ? error : new Error("PayPal checkout failed"))
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={handlePayPalClick}
      disabled={disabled || isProcessing}
      className="w-full bg-[#ffc439] hover:bg-[#f7bb38] text-[#253b80] py-3 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
    >
      <span className="mr-1">Pay with</span>
      <span className="font-bold text-[#253b80]">
        Pay<span className="text-[#179bd7]">Pal</span>
      </span>
    </button>
  )
}

export default CustomPayPalButton

