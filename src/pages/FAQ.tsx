"use client"

import type React from "react"
import { useState } from "react"
import {
  ChevronDown,
  Search,
  MessageCircle,
  Shield,
  CreditCard,
  Youtube,
  Instagram,
  Facebook,
  Zap,
  ArrowLeft,
} from "lucide-react"

interface FAQItem {
  question: string
  answer: React.ReactNode
}

interface FAQSection {
  title: string
  icon: React.ElementType
  items: FAQItem[]
}

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0])) // First section open by default
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const sections: FAQSection[] = [
    {
      title: "Getting Started",
      icon: Zap,
      items: [
        {
          question: "What is WinProd AI?",
          answer: (
            <p>
              WinProd AI is the ultimate AI-powered platform for discovering winning products in eCommerce. Our
              cutting-edge technology scans and curates high-converting products, eliminating the guesswork so you can
              focus on scaling your business. Whether you're a dropshipper, Amazon seller, or own a Shopify store,
              WinProd AI provides data-driven insights, sales analytics, and exclusive tools to help you maximize
              profits with proven products.
            </p>
          ),
        },
        {
          question: "Can I use WinProd AI on any platform or marketplace?",
          answer: (
            <p>
              WinProd AI isn't limited to any single platform. You can use it for your own Shopify store, Amazon FBA,
              Etsy, eBay, or any other eCommerce platform. Import and list as many products as you like—our AI ensures
              you're always selling products with high potential.
            </p>
          ),
        },
        {
          question: "How often are new winning products added?",
          answer: (
            <p>
              Daily! Our AI continuously scans the market, analyzing sales trends, engagement data, and competition to
              curate new winning products every day. We focus on quality over quantity, ensuring every product meets our
              strict criteria for profitability.
            </p>
          ),
        },
      ],
    },
    {
      title: "Features & Benefits",
      icon: Shield,
      items: [
        {
          question: "What makes WinProd AI's product selection special?",
          answer: (
            <div>
              <p className="mb-4">We don't rely on random selections—our AI-driven research team analyzes:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Market demand
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Ad performance
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Competitor data
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Profit margins
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Trend forecasting
                </li>
              </ul>
              <p className="mt-4">With WinProd AI, you're not guessing—you're selling products that work.</p>
            </div>
          ),
        },
        {
          question: "What features does WinProd AI offer?",
          answer: (
            <div>
              <p className="mb-4">WinProd AI is more than just a product database. Our platform includes:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span> AI-powered product curation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span> Sales data & analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span> Competitor tracking & spying tools
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span> AI-generated ad copy & targeting suggestions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span> Product performance tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✅</span> Marketing strategies & automation tools
                </li>
              </ul>
              <p className="mt-4">
                We designed WinProd AI to be a one-stop solution for sellers looking to scale with high-performing
                products.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      title: "Community & Social",
      icon: Facebook,
      items: [
        {
          question: "Does WinProd AI have a community?",
          answer: (
            <p>
              Yes! We believe in building a winning community. Join our exclusive Facebook group where sellers share
              strategies, success stories, and insights. After signing up, you'll receive an invitation to our private
              group, or you can search for WinProd AI Official on Facebook.
            </p>
          ),
        },
        {
          question: "Is WinProd AI on YouTube and Instagram?",
          answer: (
            <div className="space-y-4">
              <p>
                Yes! We regularly upload eCommerce strategies, product research tips, and case studies on YouTube.
                Follow us on Instagram for daily insights, product showcases, and success stories.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#" className="flex items-center gap-2 text-red-600 hover:text-red-700">
                  <Youtube size={20} />
                  <span>WinProd AI Official</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-pink-600 hover:text-pink-700">
                  <Instagram size={20} />
                  <span>@winprod_ai</span>
                </a>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Marketing & Advertising",
      icon: CreditCard,
      items: [
        {
          question: "Which advertising methods work best with WinProd AI products?",
          answer: (
            <div className="space-y-4">
              <p>Our data shows the best results come from:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 shrink-0">📌</span>
                  <span>
                    <strong>Facebook & Instagram Ads</strong> – AI-suggested audience targeting
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 shrink-0">📌</span>
                  <span>
                    <strong>Google Shopping & SEO</strong> – High-intent buyer targeting
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 shrink-0">📌</span>
                  <span>
                    <strong>TikTok Influencer Marketing</strong> – Viral product trends
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 shrink-0">📌</span>
                  <span>
                    <strong>Amazon & eBay Selling</strong> – AI-driven product ranking
                  </span>
                </li>
              </ul>
              <p>Use our AI-powered ad insights to maximize ROAS!</p>
            </div>
          ),
        },
        {
          question: "Can I use the product images & videos provided?",
          answer: (
            <p>
              Yes! We provide high-quality images for you to use in your store, product listings, and ad campaigns. We
              also suggest video ad styles based on top-performing creatives. For best results, customize your video ads
              to stand out in the marketplace.
            </p>
          ),
        },
      ],
    },
    {
      title: "Billing & Support",
      icon: MessageCircle,
      items: [
        {
          question: "What subscription plans does WinProd AI offer?",
          answer: (
            <div className="space-y-2">
              <p>We offer flexible plans to suit different needs:</p>
              <ul className="space-y-2">
                <li>
                  <strong>Free Plan</strong> – Limited access to winning products
                </li>
                <li>
                  <strong>Pro Plan</strong> – Full access to product data, analytics, and AI-driven insights + VIP
                  support & advanced automation
                </li>
              </ul>
            </div>
          ),
        },
        {
          question: "What payment methods do you accept?",
          answer: <p>We accept PayPal, credit/debit cards, and cryptocurrency payments for subscriptions.</p>,
        },
        {
          question: "Do you offer refunds?",
          answer: (
            <p>
              Yes! We have a 30-day money-back guarantee on all paid plans. If you're not satisfied, simply contact
              support for a full refund—no questions asked.
            </p>
          ),
        },
        {
          question: "Is there a contract or commitment?",
          answer: <p>No contracts, no long-term commitments. You can cancel anytime with no penalties.</p>,
        },
        {
          question: "How secure is WinProd AI?",
          answer: (
            <p>
              Your data is fully encrypted and protected. Our payment processing is SSL-certified and handled through
              secure gateways.
            </p>
          ),
        },
        {
          question: "How do I contact support?",
          answer: (
            <div className="space-y-3">
              <p>Our 24/7 support team is always ready to assist you.</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span>📩</span>
                  <span>Email: support@winprod.ai</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>💬</span>
                  <span>Live Chat: Available on our website</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📱</span>
                  <span>Phone: 1-313-717-2115</span>
                </li>
              </ul>
            </div>
          ),
        },
      ],
    },
  ]

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleQuestion = (question: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(question)) {
        next.delete(question)
      } else {
        next.add(question)
      }
      return next
    })
  }

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.question.toLowerCase().includes(searchQuery.toLowerCase())),
    }))
    .filter((section) => section.items.length > 0)

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">Everything you need to know about WinProd AI</p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(sectionIndex)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <section.icon size={24} className="text-primary" />
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transform transition-transform duration-200 ${
                    expandedSections.has(sectionIndex) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Section Content */}
              {expandedSections.has(sectionIndex) && (
                <div>
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => toggleQuestion(item.question)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="text-left font-medium text-gray-900">{item.question}</h3>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 transform transition-transform duration-200 ${
                            expandedQuestions.has(item.question) ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expandedQuestions.has(item.question) && (
                        <div className="px-6 pb-4 text-gray-600">{item.answer}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions? We're here to help!</p>
          <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
            <MessageCircle size={20} />
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}

export default FAQ

