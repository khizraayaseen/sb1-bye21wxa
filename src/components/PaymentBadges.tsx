import React from 'react';
import { Shield, Lock, CheckCircle, CreditCard, Wallet, DollarSign, Star, Users, Clock } from 'lucide-react';
import { paymentBadges } from '../lib/payments';

const iconMap = {
  Shield,
  Lock,
  CheckCircle,
  CreditCard,
  Wallet,
  DollarSign,
  Star,
  Users,
  Clock
};

const PaymentBadges = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Security Badges */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-white text-sm font-medium mb-3">Secure Payments</h3>
        <div className="space-y-2">
          {paymentBadges.security.map((badge, index) => (
            <div key={index} className="flex items-center gap-2">
              {React.createElement(iconMap[badge.icon as keyof typeof iconMap], {
                size: 16,
                className: badge.color
              })}
              <span className="text-gray-300 text-sm">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-white text-sm font-medium mb-3">Payment Methods</h3>
        <div className="space-y-2">
          {paymentBadges.payments.map((badge, index) => (
            <div key={index} className="flex items-center gap-2">
              {React.createElement(iconMap[badge.icon as keyof typeof iconMap], {
                size: 16,
                className: badge.color
              })}
              <span className="text-gray-300 text-sm">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-white text-sm font-medium mb-3">Why Trust Us</h3>
        <div className="space-y-2">
          {paymentBadges.trust.map((badge, index) => (
            <div key={index} className="flex items-center gap-2">
              {React.createElement(iconMap[badge.icon as keyof typeof iconMap], {
                size: 16,
                className: badge.color
              })}
              <span className="text-gray-300 text-sm">{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentBadges;