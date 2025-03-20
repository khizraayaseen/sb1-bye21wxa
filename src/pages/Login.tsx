import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { supabase, getSiteUrl, sendPasswordResetEmail } from '../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      // Try to sign in with Supabase
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

    if (signInError) throw signInError;

    
      if (!signInData.user) throw new Error('No user data returned');

  
     console.log("ici");
     

      // Try to update last login for existing customer
      const { error: updateError } = await supabase.from('customers').upsert({
        user_id: signInData.user.id,
        email: signInData.user.email,
        full_name:
          signInData.user.user_metadata?.full_name || email.split('@')[0],
        subscription_status: 'free',
        subscription_tier: 'free',
        last_login: new Date().toISOString(),
      });

      if (updateError) {
        console.error('Error updating customer record:', updateError);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      await sendPasswordResetEmail(email);

      setSuccess(
        'Password reset instructions have been sent to your email. Please check your inbox and spam folder.'
      );

      // Clear email field after successful send
      setEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to send reset instructions. Please try again or contact support.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'facebook') => {
    try {
      console.log('google');
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });

      if (error) throw error;

      // The redirect will happen automatically
    } catch (error) {
      setError(`Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <img
            className="h-24 w-auto"
            src="https://i.postimg.cc/QxLkYX3X/Ecom-Degen-Logo.png"
            alt="WinProd AI"
          />
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-white">
          {isResetMode ? 'Reset your password' : 'Sign in to your account'}
        </h2>
        {!isResetMode && (
          <p className="mt-2 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary/90"
            >
              Sign up
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 py-8 px-6 shadow rounded-lg backdrop-blur-sm border border-white/10">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {isResetMode ? (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-gray-200"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-lg placeholder-gray-500 text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="flex items-center text-sm text-primary hover:text-primary/90"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Back to login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-200"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-lg placeholder-gray-500 text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-200"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-white/20 rounded-lg placeholder-gray-500 text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-white/20 rounded bg-white/5"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-200"
                  >
                    Remember Me
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="font-medium text-primary hover:text-primary/90 text-sm"
                >
                  Forgot your password?
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          )}

          {!isResetMode && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-black text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn('google')}
                    className="w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-lg shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-black"
                  >
                    <img
                      src="https://www.google.com/favicon.ico"
                      alt="Google"
                      className="h-5 w-5 mr-2"
                    />
                    Google
                  </button>
                  {/* <button
                    type="button"
                    onClick={() => handleSocialSignIn('facebook')}
                    className="w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-lg shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-black"
                  >
                    <svg
                      className="h-5 w-5 mr-2 text-[#1877F2]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm3.283 8.25h-1.5c-.567 0-.666.24-.666.85v1.15h2.166l-.283 2.25h-1.883V19h-2.75v-6.5H8.5v-2.25h1.867V8.5C10.367 6.5 11.35 5 13.5 5h1.783v3.25z" />
                    </svg>
                    Facebook
                  </button> */}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-center text-xs text-gray-400">
                  Protected by SSL Security - Login with{' '}
                  <span className="text-primary">winprod.ai</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="flex justify-center space-x-4 text-sm text-gray-400">
          <Link to="/privacy" className="hover:text-gray-300">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-gray-300">
            Terms & Conditions
          </Link>
          <span>•</span>
          <Link to="/faq" className="hover:text-gray-300">
            FAQ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
