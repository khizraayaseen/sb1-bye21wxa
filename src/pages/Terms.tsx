"use client"
import { Scale, Shield, FileText, AlertCircle, Handshake, MessageCircle, ArrowLeft } from "lucide-react"

const Terms = () => {
  const sections = [
    {
      icon: FileText,
      title: "Agreement to Terms",
      content: [
        {
          text: "By accessing or using WinProd AI, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.",
          items: [
            "These terms apply to all users, visitors, and others who access or use WinProd AI",
            "You must be at least 18 years of age to use this platform",
            "Commercial use is permitted only in accordance with these terms",
            "Any violation of these terms may result in immediate termination of your access",
          ],
        },
      ],
    },
    {
      icon: Shield,
      title: "Intellectual Property Rights",
      content: [
        {
          subtitle: "Our Content",
          text: "WinProd AI and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.",
          items: [
            "Product data and analytics",
            "AI-generated content and recommendations",
            "Platform design and interface",
            "Marketing materials and resources",
          ],
        },
        {
          subtitle: "User Content",
          text: "By posting content on WinProd AI, you grant us the right to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through the platform.",
          items: [
            "You retain all rights to your content",
            "You are responsible for the content you post",
            "We may remove content that violates these terms",
            "We may use your feedback to improve our services",
          ],
        },
      ],
    },
    {
      icon: Scale,
      title: "User Responsibilities",
      content: [
        {
          text: "As a user of WinProd AI, you agree to:",
          items: [
            "Provide accurate and complete information",
            "Maintain the security of your account",
            "Not share your account credentials",
            "Not use the platform for illegal purposes",
            "Not attempt to access restricted areas",
            "Not interfere with platform performance",
            "Not engage in unauthorized data collection",
          ],
        },
      ],
    },
    {
      icon: AlertCircle,
      title: "Disclaimers",
      content: [
        {
          text: "WinProd AI is provided 'as is' and 'as available' without warranties of any kind, either express or implied, including but not limited to:",
          items: [
            "Accuracy of product data and market insights",
            "Availability of the platform",
            "Success of your business ventures",
            "Compatibility with your systems",
            "Freedom from viruses or harmful code",
          ],
        },
        {
          subtitle: "Financial Decisions",
          text: "Any financial or business decisions made based on our platform's data are at your own risk. We do not guarantee profit or success.",
        },
      ],
    },
    {
      icon: Handshake,
      title: "Subscription Terms",
      content: [
        {
          subtitle: "Payment Terms",
          text: "By subscribing to WinProd AI, you agree to:",
          items: [
            "Pay all applicable fees on time",
            "Maintain valid payment information",
            "Accept automatic renewal unless cancelled",
            "Receive no refunds for partial months",
          ],
        },
        {
          subtitle: "Cancellation",
          text: "You may cancel your subscription at any time. Upon cancellation:",
          items: [
            "Access continues until the end of the billing period",
            "No partial refunds are provided",
            "Saved data may be deleted after 30 days",
            "Reactivation requires a new subscription",
          ],
        },
      ],
    },
    {
      icon: MessageCircle,
      title: "Contact Information",
      content: [
        {
          text: "For any questions about these Terms of Service:",
          items: ["Email: legal@winprod.ai", "Address: 123 AI Street, Tech City, TC 12345", "Phone: 1-800-WINPROD"],
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Fixed Back Button */}
        <div className="fixed top-4 left-4 z-50">
          <button
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-primary hover:text-primary/80 py-2 px-4 rounded-lg shadow-sm border border-gray-200 transition-colors"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: February 18, 2025</p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <p className="text-gray-600 leading-relaxed">
            Welcome to WinProd AI. These Terms of Service govern your access to and use of the WinProd AI platform,
            including any content, functionality, and services offered. Please read these terms carefully before using
            our platform.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Section Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <section.icon className="text-primary" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6">
                {section.content.map((block, blockIndex) => (
                  <div key={blockIndex} className="mb-6 last:mb-0">
                    {block.subtitle && <h3 className="text-lg font-medium text-gray-900 mb-2">{block.subtitle}</h3>}
                    {block.text && <p className="text-gray-600 mb-3">{block.text}</p>}
                    {block.items && (
                      <ul className="space-y-2">
                        {block.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-gray-600">
                            <span className="text-primary mt-1.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            These terms of service are subject to change. We will notify you of any changes by posting the new terms on
            this page. Your continued use of the platform after such modifications constitutes your acknowledgment and
            agreement to the modified terms.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Terms

