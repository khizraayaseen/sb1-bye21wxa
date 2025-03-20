import React from 'react';
import { Shield, Lock, Eye, Database, Cookie, Mail, ArrowLeft} from 'lucide-react';

const Privacy = () => {
  const sections = [
    {
      icon: Shield,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Personal Information",
          text: "We collect information that you provide directly to us, including:",
          items: [
            "Name and contact information",
            "Payment information",
            "Account credentials",
            "Communication preferences",
            "Product preferences and interests"
          ]
        },
        {
          subtitle: "Usage Information",
          text: "We automatically collect certain information about your interaction with our platform:",
          items: [
            "Device and browser information",
            "IP address and location data",
            "Usage patterns and preferences",
            "Performance and error data",
            "Referral and click-through data"
          ]
        }
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        {
          text: "We use the collected information for the following purposes:",
          items: [
            "Providing and improving our services",
            "Processing your transactions",
            "Personalizing your experience",
            "Communicating with you about products and updates",
            "Analyzing and optimizing our platform",
            "Protecting against fraud and abuse",
            "Complying with legal obligations"
          ]
        }
      ]
    },
    {
      icon: Database,
      title: "Information Sharing",
      content: [
        {
          text: "We may share your information with:",
          items: [
            "Service providers and business partners",
            "Payment processors and financial institutions",
            "Analytics and advertising partners",
            "Law enforcement when required by law",
            "Other users with your consent"
          ]
        },
        {
          subtitle: "We Never Sell Your Data",
          text: "WinProd AI does not sell or rent your personal information to third parties for their marketing purposes without your explicit consent."
        }
      ]
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        {
          text: "We implement industry-standard security measures:",
          items: [
            "SSL/TLS encryption for all data transmission",
            "Secure data storage with encryption at rest",
            "Regular security audits and penetration testing",
            "Access controls and authentication protocols",
            "Continuous monitoring for suspicious activities"
          ]
        }
      ]
    },
    {
      icon: Cookie,
      title: "Cookies and Tracking",
      content: [
        {
          text: "We use cookies and similar technologies to:",
          items: [
            "Maintain your session and preferences",
            "Analyze platform usage and performance",
            "Provide personalized recommendations",
            "Improve user experience",
            "Deliver relevant advertising"
          ]
        },
        {
          subtitle: "Your Choices",
          text: "You can manage cookie preferences through your browser settings. Note that disabling certain cookies may limit functionality."
        }
      ]
    },
    {
      icon: Mail,
      title: "Contact Information",
      content: [
        {
          text: "For privacy-related inquiries:",
          items: [
            "Email: privacy@winprod.ai",
            "Phone: 1-313-717-2115",
            "Address: 123 AI Street, Tech City, TC 12345"
          ]
        },
        {
          subtitle: "Response Time",
          text: "We aim to respond to all privacy-related inquiries within 48 hours."
        }
      ]
    }
  ];

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: February 18, 2025</p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <p className="text-gray-600 leading-relaxed">
            At WinProd AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
            disclose, and safeguard your information when you use our platform. Please read this privacy policy 
            carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.
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
                    {block.subtitle && (
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {block.subtitle}
                      </h3>
                    )}
                    {block.text && (
                      <p className="text-gray-600 mb-3">{block.text}</p>
                    )}
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
            This privacy policy is subject to change. We will notify you of any changes by posting the new 
            privacy policy on this page. Changes are effective immediately upon posting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;