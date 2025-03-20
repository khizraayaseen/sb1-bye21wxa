"use client"

import { useState, useEffect } from "react"
import { Send, Users, Mail, X, Check, AlertTriangle, FileText, Calendar, Clock } from "lucide-react"
import type { EmailTemplate } from "../../lib/email-service"

interface Campaign {
  id: string
  name: string
  subject: string
  segment: string
  status: "draft" | "scheduled" | "sent"
  sent_count: number
  open_count: number
  click_count: number
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
}

const AdminEmailMarketing = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedSegment, setSelectedSegment] = useState<string>("all")
  const [campaignName, setCampaignName] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [actionStatus, setActionStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  // Segments for targeting specific user groups
  const segments = [
    { id: "all", name: "All Users" },
    { id: "pro", name: "Pro Subscribers" },
    { id: "free", name: "Free Users" },
    { id: "inactive", name: "Inactive Users (30+ days)" },
  ]

  useEffect(() => {
    fetchTemplates()
    fetchCampaigns()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/email/templates")

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      // Filter to only show marketing templates
      const marketingTemplates = data.filter(
        (template: EmailTemplate) => template.type === "marketing" && template.is_active,
      )
      setTemplates(marketingTemplates)
    } catch (error) {
      console.error("Error fetching email templates:", error)
      setActionStatus({
        type: "error",
        message: "Failed to load email templates",
      })
    }
  }

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll use mock data
      const mockCampaigns: Campaign[] = [
        {
          id: "1",
          name: "Weekly Newsletter - New Products",
          subject: "Discover This Week's Winning Products!",
          segment: "all",
          status: "sent",
          sent_count: 1250,
          open_count: 780,
          click_count: 320,
          scheduled_at: null,
          sent_at: "2025-02-15T10:30:00Z",
          created_at: "2025-02-14T15:45:00Z",
        },
        {
          id: "2",
          name: "Pro Users - Special Offer",
          subject: "Exclusive: New Features for Pro Users",
          segment: "pro",
          status: "scheduled",
          sent_count: 0,
          open_count: 0,
          click_count: 0,
          scheduled_at: "2025-02-25T09:00:00Z",
          sent_at: null,
          created_at: "2025-02-20T11:20:00Z",
        },
        {
          id: "3",
          name: "Re-engagement Campaign",
          subject: "We Miss You! Come Back and See What's New",
          segment: "inactive",
          status: "draft",
          sent_count: 0,
          open_count: 0,
          click_count: 0,
          scheduled_at: null,
          sent_at: null,
          created_at: "2025-02-18T14:10:00Z",
        },
      ]

      setCampaigns(mockCampaigns)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      setActionStatus({
        type: "error",
        message: "Failed to load campaigns",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!selectedTemplate || !campaignName) {
      setActionStatus({
        type: "error",
        message: "Please select a template and enter a campaign name",
      })
      return
    }

    try {
      setIsSending(true)

      // Check if this is a scheduled campaign
      let scheduledDateTime = null
      if (scheduledDate && scheduledTime) {
        scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)

        // Validate the date is in the future
        if (scheduledDateTime <= new Date()) {
          throw new Error("Scheduled time must be in the future")
        }
      }

      // In a real implementation, you would call your API to send or schedule the campaign
      // For now, we'll simulate a successful send
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Add the new campaign to the list
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignName,
        subject: templates.find((t) => t.id === selectedTemplate)?.subject || "Campaign",
        segment: selectedSegment,
        status: scheduledDateTime ? "scheduled" : "sent",
        sent_count: scheduledDateTime ? 0 : selectedSegment === "all" ? 1500 : 500,
        open_count: 0,
        click_count: 0,
        scheduled_at: scheduledDateTime?.toISOString() || null,
        sent_at: scheduledDateTime ? null : new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      setCampaigns([newCampaign, ...campaigns])
      setShowSendModal(false)
      resetForm()

      setActionStatus({
        type: "success",
        message: scheduledDateTime
          ? `Campaign scheduled for ${scheduledDateTime.toLocaleString()}`
          : "Campaign sent successfully",
      })
    } catch (error) {
      console.error("Error sending campaign:", error)
      setActionStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send campaign",
      })
    } finally {
      setIsSending(false)
    }
  }

  const resetForm = () => {
    setSelectedTemplate("")
    setSelectedSegment("all")
    setCampaignName("")
    setScheduledDate("")
    setScheduledTime("")
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Calculate open rate
  const calculateOpenRate = (campaign: Campaign) => {
    if (campaign.sent_count === 0) return "0%"
    return `${Math.round((campaign.open_count / campaign.sent_count) * 100)}%`
  }

  // Calculate click rate
  const calculateClickRate = (campaign: Campaign) => {
    if (campaign.open_count === 0) return "0%"
    return `${Math.round((campaign.click_count / campaign.open_count) * 100)}%`
  }

  // Get segment name
  const getSegmentName = (segmentId: string) => {
    return segments.find((s) => s.id === segmentId)?.name || segmentId
  }

  // Modal component
  const SendCampaignModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Send Marketing Campaign</h2>
          <button
            onClick={() => setShowSendModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Schedule (Optional)</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Leave empty to send immediately. Both date and time are required for scheduling.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowSendModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendCampaign}
              disabled={isSending || !selectedTemplate || !campaignName}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : scheduledDate && scheduledTime ? (
                <>
                  <Calendar size={18} />
                  Schedule Campaign
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Campaign
                </>
              )}
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
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600">Send targeted email campaigns to your users</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowSendModal(true)
          }}
          className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Send className="h-5 w-5 mr-2" />
          Send Campaign
        </button>
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

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-primary"></div>
            <p className="ml-3">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center">
            <Mail size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No campaigns found</p>
            <button
              onClick={() => {
                resetForm()
                setShowSendModal(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
            >
              <Send size={18} className="mr-2" />
              Send Your First Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Open Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Click Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileText size={20} className="text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{campaign.subject}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{getSegmentName(campaign.segment)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          campaign.status === "sent"
                            ? "bg-green-100 text-green-800"
                            : campaign.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status === "sent" ? "Sent" : campaign.status === "scheduled" ? "Scheduled" : "Draft"}
                      </span>
                      {campaign.status === "scheduled" && campaign.scheduled_at && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {formatDate(campaign.scheduled_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.sent_count > 0 ? campaign.sent_count.toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.status === "sent" ? calculateOpenRate(campaign) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.status === "sent" ? calculateClickRate(campaign) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.sent_at
                        ? formatDate(campaign.sent_at)
                        : campaign.scheduled_at
                          ? formatDate(campaign.scheduled_at)
                          : formatDate(campaign.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Campaign Modal */}
      {showSendModal && <SendCampaignModal />}
    </div>
  )
}

export default AdminEmailMarketing

