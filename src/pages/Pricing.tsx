import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, HelpCircle, Star, Clock, Shield, Zap, Gift } from 'lucide-react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PaymentBadges from '../components/PaymentBadges';
import PaymentMethods from '../components/PaymentMethods';
import { paypalConfig } from '../lib/payments';
import { stripeConfig } from '../lib/stripe';

const Pricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('pro');
  const [error, setError] = useState<string | null>(null);

  const plans = {
    free: {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      features: [
        'Limited access to winning products database',
        '10 live trending products',
        '3 product tracker sessions',
        'Basic analytics',
        'Community access'
      ],
      notIncluded: [
        'AI-powered product research',
        'Extended analytics & insights',
        'Priority support',
        'Private Discord community'
      ]
    },
    pro: {
      name: 'Pro',
      price: { monthly: 49, yearly: 25 },
      savings: { monthly: 0, yearly: 288 },
      features: [
        'Unlimited access to ALL winning products',
        'Full access to our complete Dropshipping Masterclass',
        '1-on-1 Ecommerce expert consultant',
        'Advanced AI-powered product research',
        'Unlimited product tracking',
        'Extended analytics & insights',
        'Priority support',
        'Private Discord community'
      ]
    }
  };

  const testimonials = [
    {
      name: 'Sarah Miller',
      role: 'Shopify Store Owner',
      content: "WinProd AI has completely transformed my dropshipping business. The AI-powered product research saves me hours every day.",
      rating: 5,
      stats: { revenue: '127K', timeframe: '3 months' },
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100'
    },
    {
      name: 'David Chen',
      role: 'eCommerce Entrepreneur',
      content: "The product analytics and insights are incredible. I have increased my store's revenue by 300% in just 3 months.",
      rating: 5,
      stats: { revenue: '89K', timeframe: '2 months' },
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
    },
    {
      name: 'Emma Thompson',
      role: 'Digital Marketer',
      content: "Best investment I've made for my business. The AI recommendations are spot-on and the support team is amazing.",
      rating: 5,
      stats: { revenue: '203K', timeframe: '6 months' },
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100'
    }
  ];

  const faqs = [
    {
      question: 'Do I have to pay for updates & new features?',
      answer: 'No! All updates and new features are included in your subscription. We continuously improve our platform to provide more value.'
    },
    {
      question: 'Is there a money-back guarantee?',
      answer: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your payment - no questions asked."
    },
    {
      question: 'Can I change plans or cancel anytime?',
      answer: 'Absolutely! You can upgrade, downgrade, or cancel your subscription at any time. No long-term contracts or commitments.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards through Stripe and PayPal payments. All transactions are secure and encrypted.'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'AI-Powered Research',
      description: 'Our AI analyzes millions of products daily to find winners'
    },
    {
      icon: Shield,
      title: '30-Day Guarantee',
      description: 'Try WinProd AI risk-free with our money-back guarantee'
    },
    {
      icon: Clock,
      title: 'Instant Access',
      description: 'Get immediate access to winning products after signup'
    }
  ];

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    navigate('/dashboard');
  };

  const handlePaymentError = (error: Error) => {
    setError(error.message);
  };

  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Complete Your Purchase</h2>
          <button 
            onClick={() => setShowPaymentModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">Pro {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">
              ${billingCycle === 'yearly' ? plans.pro.price.yearly : plans.pro.price.monthly}/mo
              {billingCycle === 'yearly' && (
                <span className="text-green-600 text-sm ml-2">Save ${plans.pro.savings.yearly}/year</span>
              )}
            </span>
          </div>
        </div>

        <PaymentMethods
          priceId={billingCycle === 'yearly' ? stripeConfig.prices.yearly.pro : stripeConfig.prices.monthly.pro}
          amount={billingCycle === 'yearly' ? plans.pro.price.yearly : plans.pro.price.monthly}
          interval={billingCycle}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  );

  return (
    <PayPalScriptProvider options={paypalConfig}>
      <div className="min-h-screen bg-black">
        <Header onMenuClick={() => {}} />

        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4">
            {/* Blowout Sale Banner */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <Gift size={16} className="animate-bounce" />
                Blowout Sale - Save up to 49% today!
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Choose the right plan for you
              </h1>
              <p className="text-xl text-gray-400">Start finding winning products today</p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
                  <benefit.icon size={24} className="text-primary mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">{benefit.title}</h3>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>

            {/* Payment Badges */}
            <PaymentBadges />

            {/* Billing Toggle */}
            <div className="flex justify-center mb-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-1 inline-flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    billingCycle === 'yearly'
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Yearly
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Save 49%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
              {/* Free Plan */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">{plans.free.name}</h2>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-gray-400 text-lg">$</span>
                    <span className="text-5xl font-bold text-white">0</span>
                    <span className="text-gray-400 text-lg">/mo</span>
                  </div>
                  <p className="text-gray-400 mt-2">Free forever</p>
                </div>

                <div className="mb-8">
                  <p className="text-sm font-medium text-gray-400 mb-4">INCLUDED FEATURES:</p>
                  <ul className="space-y-4">
                    {plans.free.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-300">
                        <Check size={20} className="text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-8">
                  <p className="text-sm font-medium text-gray-400 mb-4">NOT INCLUDED:</p>
                  <ul className="space-y-4">
                    {plans.free.notIncluded.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-300">
                        <X size={20} className="text-red-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Get Started Free
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-b from-primary/20 to-primary/5 backdrop-blur-sm rounded-xl border border-primary/50 p-8 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">{plans.pro.name}</h2>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-gray-400 text-lg">$</span>
                    <span className="text-5xl font-bold text-white">
                      {plans.pro.price[billingCycle]}
                    </span>
                    <span className="text-gray-400 text-lg">/mo</span>
                  </div>
                  <div className="text-gray-400 mt-2">
                    {billingCycle === 'yearly' ? (
                      <span>
                        Billed annually (Save ${plans.pro.savings.yearly}/year)
                      </span>
                    ) : (
                      'Billed monthly'
                    )}
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-sm font-medium text-gray-400 mb-4">EVERYTHING IN FREE, PLUS:</p>
                  <ul className="space-y-4">
                    {plans.pro.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-300">
                        <Check size={20} className="text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlan('pro');
                    setShowPaymentModal(true);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Get Started with Pro
                </button>

                <p className="text-center text-sm text-gray-400 mt-4">
                  30-day money-back guarantee
                </p>
              </div>
            </div>

            {/* Testimonials */}
            <div className="max-w-5xl mx-auto mb-16">
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                Join thousands of successful store owners
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={16} className="text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-4">{testimonial.content}</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium">{testimonial.name}</p>
                        <p className="text-gray-400 text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Revenue</span>
                        <span className="text-green-500 font-medium">${testimonial.stats.revenue}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-400">Time Frame</span>
                        <span className="text-white">{testimonial.stats.timeframe}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                Frequently asked questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
                  >
                    <h3 className="text-white font-medium mb-2 flex items-start gap-3">
                      <HelpCircle size={20} className="text-primary shrink-0" />
                      {faq.question}
                    </h3>
                    <p className="text-gray-400 ml-9">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Final CTA */}
            <div className="max-w-3xl mx-auto mt-16 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to start finding winning products?
              </h2>
              <p className="text-gray-400 mb-8">
                Join WinProd AI today and get access to our AI-powered product research platform.
              </p>
              <button
                onClick={() => {
                  setSelectedPlan('pro');
                  setShowPaymentModal(true);
                }}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>

        <Footer />

        {/* Payment Modal */}
        {showPaymentModal && <PaymentModal />}
      </div>
    </PayPalScriptProvider>
  );
};

export default Pricing;