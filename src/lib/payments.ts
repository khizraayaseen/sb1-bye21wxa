import { loadStripe } from '@stripe/stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// PayPal configuration
export const paypalConfig = {
  'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: 'USD',
  intent: 'subscription',
  'enable-funding': ['card'],
  'disable-funding': ['paylater', 'venmo'],
  components: ['buttons'],
  vault: true // Enable vault for subscriptions
};

// PayPal subscription plan IDs
export const paypalPlans = {
  monthly: {
    pro: 'P-48V859456P095382NM64UKFI'
  },
  yearly: {
    pro: 'P-38A5873772451202AM64UM3Q'
  }
};

// Payment service
export class PaymentService {
  static async createStripeSubscription(priceId: string, customerId?: string) {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not initialized');

      const { sessionId } = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerId,
          mode: 'subscription'
        }),
      }).then(res => res.json());

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw error;
    }
  }

  static async createStripeOneTimePayment(priceId: string, customerId?: string) {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not initialized');

      const { sessionId } = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerId,
          mode: 'payment'
        }),
      }).then(res => res.json());

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      console.error('Error creating Stripe payment:', error);
      throw error;
    }
  }

  static async handlePayPalSubscription(subscriptionId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          paypal_subscription_id: subscriptionId,
          status: 'active',
          plan_id: 'pro',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error handling PayPal subscription:', error);
      throw error;
    }
  }
}

// Payment badges configuration
export const paymentBadges = {
  security: [
    {
      icon: 'Shield',
      text: 'SSL Secure Payment',
      color: 'text-green-600'
    },
    {
      icon: 'Lock',
      text: 'End-to-end Encryption',
      color: 'text-blue-600'
    },
    {
      icon: 'CheckCircle',
      text: 'Money-back Guarantee',
      color: 'text-primary'
    }
  ],
  payments: [
    {
      icon: 'CreditCard',
      text: 'All Major Cards Accepted',
      color: 'text-gray-600'
    },
    {
      icon: 'DollarSign',
      text: 'Instant Processing',
      color: 'text-green-600'
    }
  ],
  trust: [
    {
      icon: 'Star',
      text: '4.9/5 Customer Rating',
      color: 'text-yellow-500'
    },
    {
      icon: 'Users',
      text: '10,000+ Active Users',
      color: 'text-blue-600'
    },
    {
      icon: 'Clock',
      text: '24/7 Support',
      color: 'text-primary'
    }
  ]
};