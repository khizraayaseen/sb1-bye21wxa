import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for mock admin session
    const mockAdmin = localStorage.getItem('mockAdmin');
    if (mockAdmin) {
      const adminData = JSON.parse(mockAdmin);
      setIsAdmin(adminData.isAdmin);
      return; // Skip Supabase checks if mock admin is present
    }

    // Check current Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminStatus(user: User) {
    try {
      // Skip admin check if mock admin is present
      const mockAdmin = localStorage.getItem('mockAdmin');
      if (mockAdmin) {
        const adminData = JSON.parse(mockAdmin);
        setIsAdmin(adminData.isAdmin);
        return;
      }

      const { data: customer, error } = await supabase
        .from('customers')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(customer?.subscription_tier === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }

  async function signOut() {
    localStorage.removeItem('mockAdmin'); // Clear mock admin session
    setIsAdmin(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}