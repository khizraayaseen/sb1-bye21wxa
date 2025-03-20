import React from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { PaymentService, paypalPlans } from '../lib/payments';
import { supabase } from '../lib/supabase';

interface PaymentMethodsProps {
  priceId: string;
  amount: number;
  interval: 'monthly' | 'yearly';
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  priceId,
  amount,
  interval,
  onSuccess,
  onError
}) => {
  const handleStripePayment = async () => {
    try {
      if (interval === 'monthly') {
        await PaymentService.createStripeSubscription(priceId);
      } else {
        await PaymentService.createStripeOneTimePayment(priceId);
      }
      onSuccess();
    } catch (error) {
      onError(error as Error);
    }
  };

  const handlePayPalApprove = async (data: any) => {
    try {
      const { user } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await PaymentService.handlePayPalSubscription(data.subscriptionID, user.id);
      onSuccess();
    } catch (error) {
      console.error('PayPal subscription error:', error);
      onError(error as Error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Credit Card Payment */}
      <button
        onClick={handleStripePayment}
        className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors"
      >
        Pay with Card
      </button>

      {/* PayPal Payment */}
      <div className="w-full">
        <PayPalButtons
          createSubscription={(data, actions) => {
            return actions.subscription.create({
              'plan_id': interval === 'monthly' ? paypalPlans.monthly.pro : paypalPlans.yearly.pro,
              'application_context': {
                'shipping_preference': 'NO_SHIPPING'
              }
            });
          }}
          onApprove={(data) => handlePayPalApprove(data)}
          onError={(err) => {
            console.error('PayPal error:', err);
            onError(new Error(err.message));
          }}
          onCancel={() => {
            console.log('PayPal subscription cancelled');
          }}
          style={{
            layout: 'horizontal',
            color: 'gold',
            shape: 'rect',
            label: 'subscribe'
          }}
        />
      </div>
    </div>
  );
};

export default PaymentMethods;