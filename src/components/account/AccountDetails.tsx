"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

export default function AccountDetails({ user, profile }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    company: profile?.company || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
    postal_code: profile?.postal_code || "",
    country: profile?.country || "",
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("profiles").update(formData).eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your account details have been updated successfully.",
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Account Details</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Edit Details
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">To change your email, please contact support.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
            />
          </div>
        </div>

        <h3 className="text-lg font-medium mt-8 mb-4">Billing Address</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
            />
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

