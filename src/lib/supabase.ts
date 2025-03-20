import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'winprod_auth',
    storage: window.localStorage
  },
  global: {
    headers: {
      'X-Client-Info': 'winprod-ai@1.0.0'
    }
  }
});

// Helper function to ensure customer record exists
export async function ensureCustomerRecord(userId: string, email: string, fullName?: string) {
  try {
    const { error: upsertError } = await supabase
      .from('customers')
      .upsert({
        user_id: userId,
        email: email,
        full_name: fullName || email.split('@')[0],
        subscription_status: 'free',
        subscription_tier: 'basic',
        last_login: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) throw upsertError;
  } catch (error) {
    console.error('Error ensuring customer record:', error);
    throw error;
  }
}

// Helper function to get site URL
export function getSiteUrl() {
  return siteUrl;
}

// Helper function to send password reset email
export async function sendPasswordResetEmail(email: string) {
  try {
    console.log('Sending password reset email to:', email);
    console.log('Reset URL will be:', `${getSiteUrl()}/reset-password`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/reset-password`
    });

    if (error) {
      console.error('Password reset error:', error);
      throw error;
    }

    console.log('Password reset email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}