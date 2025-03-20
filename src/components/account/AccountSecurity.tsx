"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

export default function AccountSecurity({ user }) {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))

    // Clear errors when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validatePasswordForm = () => {
    const newErrors = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required"
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!validatePasswordForm()) {
      return
    }

    setLoading(true)

    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      })

      if (signInError) {
        setErrors({ currentPassword: "Current password is incorrect" })
        return
      }

      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (updateError) throw updateError

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      })

      setIsChangingPassword(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your password.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Security Settings</h2>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Password</h3>

        {!isChangingPassword ? (
          <div>
            <p className="text-gray-600 mb-4">
              Your password was last changed {user?.updated_at ? formatDate(new Date(user.updated_at)) : "never"}.
            </p>
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Change Password
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="max-w-md">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2 border rounded-md ${
                  errors.currentPassword ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2 border rounded-md ${errors.newPassword ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
              <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long.</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2 border rounded-md ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                  setErrors({})
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-70"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
        <p className="text-gray-600 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <button
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          onClick={() => {
            toast({
              title: "Coming soon",
              description: "Two-factor authentication will be available soon.",
            })
          }}
        >
          Enable 2FA
        </button>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Sessions</h3>
        <p className="text-gray-600 mb-4">
          You're currently logged in on this device. You can log out of all other devices if you suspect unauthorized
          access.
        </p>
        <button
          className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
          onClick={async () => {
            try {
              setLoading(true)
              // Sign out from all other sessions but keep current one
              const { error } = await supabase.auth.signOut({ scope: "others" })

              if (error) throw error

              toast({
                title: "Success",
                description: "You've been logged out from all other devices.",
              })
            } catch (error) {
              console.error("Error signing out from other devices:", error)
              toast({
                title: "Error",
                description: error.message || "There was an error logging out from other devices.",
                variant: "destructive",
              })
            } finally {
              setLoading(false)
            }
          }}
        >
          Log Out of All Other Devices
        </button>
      </div>
    </div>
  )
}

