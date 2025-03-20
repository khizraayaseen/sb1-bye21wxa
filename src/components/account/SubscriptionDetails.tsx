"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/utils"

export default function SubscriptionDetails({ subscription }) {
  const [showCancelModal, setShowCancelModal] = useState(false)

  if (!subscription) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No Active Subscription</h2>
        <p className="text-gray-600 mb-6">You don't have an active subscription at the moment.</p>
        <Link href="/pricing" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
          View Pricing Plans
        </Link>
      </div>
    )
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing"
  const renewalDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
  const planName = subscription.subscription_items?.[0]?.price?.product?.name || "Premium Plan"
  const price = subscription.subscription_items?.[0]?.price?.unit_amount || 0
  const interval = subscription.subscription_items?.[0]?.price?.interval || "month"

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold">Subscription Details</h2>
        <div className="flex space-x-4">
          {isActive && (
            <>
              <Link
                href="/billing/update"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Change Plan
              </Link>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Status</span>
          <span className={`font-medium ${isActive ? "text-green-600" : "text-red-600"}`}>
            {subscription.status === "trialing"
              ? "Trial"
              : subscription.status === "active"
                ? "Active"
                : subscription.status === "canceled"
                  ? "Canceled"
                  : subscription.status === "past_due"
                    ? "Past Due"
                    : subscription.status}
          </span>
        </div>

        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Plan</span>
          <span className="font-medium">{planName}</span>
        </div>

        <div className="flex justify-between mb-4">
          <span className="text-gray-600">Price</span>
          <span className="font-medium">
            {formatCurrency(price / 100)} / {interval}
          </span>
        </div>

        {renewalDate && (
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">{subscription.cancel_at_period_end ? "Ends on" : "Renews on"}</span>
            <span className="font-medium">{formatDate(renewalDate)}</span>
          </div>
        )}

        {subscription.trial_end && (
          <div className="flex justify-between">
            <span className="text-gray-600">Trial ends on</span>
            <span className="font-medium">{formatDate(new Date(subscription.trial_end * 1000))}</span>
          </div>
        )}
      </div>

      {subscription.cancel_at_period_end && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800">
            Your subscription has been canceled and will end on {formatDate(renewalDate)}. You can reactivate your
            subscription before this date to continue your service.
          </p>
          <button
            className="mt-2 text-amber-800 underline hover:text-amber-900"
            onClick={() => {
              /* Handle reactivation */
            }}
          >
            Reactivate Subscription
          </button>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll still have access until the end of your current
              billing period on {formatDate(renewalDate)}.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => {
                  /* Handle cancellation */
                  setShowCancelModal(false)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

