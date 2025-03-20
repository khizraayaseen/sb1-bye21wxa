"use client"

import { useState, useEffect } from "react"
import { Mail, Edit, Trash2, Plus, X, Save, Send, RefreshCw, AlertTriangle, Check, Copy } from "lucide-react"
import type { EmailTemplate, EmailType } from "../../lib/email-service"

const EMAIL_TYPES: { value: EmailType; label: string }[] = [
  { value: "welcome", label: "Welcome Email" },
  { value: "transaction", label: "Transaction Email" },
  { value: "marketing", label: "Marketing Email" },
  { value: "password_reset", label: "Password Reset Email" },
]

const AdminEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [actionStatus, setActionStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  // Form state
  const [formData, setFormData] = useState<{
    name: string
    type: EmailType
    subject: string
    content: string
    is_active: boolean
  }>({
    name: "",
    type: "welcome",
    subject: "",
    content: "",
    is_active: true,
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/email/templates")

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error("Error fetching email templates:", error)
      setActionStatus({
        type: "error",
        message: "Failed to load email templates",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddTemplate = async () => {
    try {
      const response = await fetch("/api/email/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const newTemplate = await response.json()
      setTemplates([newTemplate, ...templates])
      setShowAddModal(false)
      resetForm()

      setActionStatus({
        type: "success",
        message: "Template created successfully",
      })
    } catch (error) {
      console.error("Error adding template:", error)
      setActionStatus({
        type: "error",
        message: "Failed to create template",
      })
    }
  }

  const handleUpdateTemplate = async () => {
    if (!currentTemplate) return

    try {
      const response = await fetch(`/api/email/templates?id=${currentTemplate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const updatedTemplate = await response.json()
      setTemplates(templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)))
      setShowEditModal(false)

      setActionStatus({
        type: "success",
        message: "Template updated successfully",
      })
    } catch (error) {
      console.error("Error updating template:", error)
      setActionStatus({
        type: "error",
        message: "Failed to update template",
      })
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await fetch(`/api/email/templates?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      setTemplates(templates.filter((t) => t.id !== id))

      setActionStatus({
        type: "success",
        message: "Template deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting template:", error)
      setActionStatus({
        type: "error",
        message: "Failed to delete template",
      })
    }
  }

  const handleResetTemplates = async () => {
    try {
      const response = await fetch("/api/email/templates", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reset" }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      await fetchTemplates()
      setResetConfirmOpen(false)

      setActionStatus({
        type: "success",
        message: "Templates reset to defaults successfully",
      })
    } catch (error) {
      console.error("Error resetting templates:", error)
      setActionStatus({
        type: "error",
        message: "Failed to reset templates",
      })
    }
  }

  const handleSendTestEmail = async () => {
    if (!currentTemplate || !testEmail) return

    try {
      const response = await fetch("/api/email/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: currentTemplate.id,
          email: testEmail,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      setShowTestModal(false)
      setTestEmail("")

      setActionStatus({
        type: "success",
        message: "Test email sent successfully",
      })
    } catch (error) {
      console.error("Error sending test email:", error)
      setActionStatus({
        type: "error",
        message: "Failed to send test email",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "welcome",
      subject: "",
      content: "",
      is_active: true,
    })
  }

  const openEditModal = (template: EmailTemplate) => {
    setCurrentTemplate(template)
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      content: template.content,
      is_active: template.is_active,
    })
    setShowEditModal(true)
  }

  const openTestModal = (template: EmailTemplate) => {
    setCurrentTemplate(template)
    setShowTestModal(true)
  }

  // Modal components
  const TemplateModal = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{isEdit ? "Edit Email Template" : "Add New Email Template"}</h2>
          <button
            onClick={() => (isEdit ? setShowEditModal(false) : setShowAddModal(false))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as EmailType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isEdit} // Can't change type for existing templates
            >
              {EMAIL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Content (HTML)</label>
            <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
              <p className="text-sm text-gray-500 mb-2">Available variables:</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ name }}"}</span>
                <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ email }}"}</span>
                <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ date }}"}</span>
                {formData.type === "transaction" && (
                  <>
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ transactionId }}"}</span>
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ amount }}"}</span>
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ plan }}"}</span>
                  </>
                )}
                {formData.type === "marketing" && (
                  <>
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ campaignId }}"}</span>
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ featuredProduct }}"}</span>
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ featuredDescription }}"}</span>
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ featuredLink }}"}</span>
                  </>
                )}
                {formData.type === "password_reset" && (
                  <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">{"{{ resetLink }}"}</span>
                )}
              </div>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mt-2"
              rows={15}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => (isEdit ? setShowEditModal(false) : setShowAddModal(false))}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={isEdit ? handleUpdateTemplate : handleAddTemplate}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              {isEdit ? "Update Template" : "Save Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const TestEmailModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Send Test Email</h2>
          <button
            onClick={() => setShowTestModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">{currentTemplate?.name}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Send Test To</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowTestModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={!testEmail}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              Send Test
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const ResetConfirmModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Reset Templates</h2>
          <button
            onClick={() => setResetConfirmOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle size={24} />
            <p className="font-medium">Warning</p>
          </div>

          <p className="text-gray-700">
            This will delete all existing email templates and restore the default templates. This action cannot be
            undone.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setResetConfirmOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetTemplates}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Reset Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600">Manage email templates for different types of communications</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Reset to Defaults
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Template
          </button>
        </div>
      </div>

      {/* Status message */}
      {actionStatus.type && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            actionStatus.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {actionStatus.type === "success" ? <Check size={20} /> : <AlertTriangle size={20} />}
          <p>{actionStatus.message}</p>
          <button onClick={() => setActionStatus({ type: null, message: "" })} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Templates Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-primary"></div>
            <p className="ml-3">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <Mail size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No email templates found</p>
            <button
              onClick={() => {
                resetForm()
                setShowAddModal(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} className="mr-2" />
              Add Your First Template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {EMAIL_TYPES.find((t) => t.value === template.type)?.label || template.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-xs">{template.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          template.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openTestModal(template)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Send Test Email"
                        >
                          <Send size={18} />
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(template.content)
                            setActionStatus({
                              type: "success",
                              message: "Template HTML copied to clipboard",
                            })
                          }}
                          className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Copy HTML"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Template"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <TemplateModal isEdit={false} />}
      {showEditModal && <TemplateModal isEdit={true} />}
      {showTestModal && <TestEmailModal />}
      {resetConfirmOpen && <ResetConfirmModal />}
    </div>
  )
}

export default AdminEmailTemplates

