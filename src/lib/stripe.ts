import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

export interface StripeConfig {
  publicKey: string;
  prices: {
    monthly: {
      pro: string;
    };
    yearly: {
      pro: string;
    };
  };
}

// Initialize Stripe configuration
export const stripeConfig: StripeConfig = {
  publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  prices: {
    monthly: {
      pro: 'price_monthly_pro' // Replace with your Stripe monthly price ID
    },
    yearly: {
      pro: 'price_yearly_pro' // Replace with your Stripe yearly price ID
    }
  }
};

// Initialize Stripe
export const stripe = loadStripe(stripeConfig.publicKey);

export class StripeService {
  static async createCheckoutSession(priceId: string, customerId?: string) {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.data.user.id}`
        },
        body: JSON.stringify({
          priceId,
          customerId,
          userId: user.data.user.id,
          email: user.data.user.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  static async getSubscription() {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.data.user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  static async getPaymentHistory() {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }
}