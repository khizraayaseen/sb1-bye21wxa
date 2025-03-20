"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Facebook, Mail } from "lucide-react"
import { supabase } from "../lib/supabase"
import { sendWelcomeEmailAfterSignup } from "../lib/utils"

const Register = () => {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setError("")
      setLoading(true)

      // Sign up with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error("No user data returned")
      const { error: customerError } = await supabase.from("customers").insert({
        user_id: authData.user.id,
        email,
        full_name: fullName,
        subscription_status: "free",
        subscription_tier: "basic",
      })

      if (customerError) throw customerError

      // Send welcome email
      await sendWelcomeEmailAfterSignup(authData.user.id, email, fullName)

      navigate("/dashboard")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: "google" | "facebook") => {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // The redirect will happen automatically
    } catch (error) {
      setError(`Failed to sign in with ${provider}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="block">
            <img
              className="mx-auto h-24 w-auto"
              src="https://i.postimg.cc/QxLkYX3X/Ecom-Degen-Logo.png"
              alt="WinProd AI"
            />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:text-primary/90">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Social Sign Up Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialSignUp("google")}
              disabled={loading}
              className="w-full inline-flex justify-center py-2.5 px-4 border border-white/20 rounded-lg shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5 mr-2" />
              Google
            </button>
            <button
              onClick={() => handleSocialSignUp("facebook")}
              disabled={loading}
              className="w-full inline-flex justify-center py-2.5 px-4 border border-white/20 rounded-lg shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Facebook className="h-5 w-5 mr-2 text-[#1877F2]" />
              Facebook
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-400">Or continue with</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleEmailSignUp}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="full-name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="full-name"
                  name="full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-500 text-white bg-white/5 rounded-t-lg focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-500 text-white bg-white/5 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/20 placeholder-gray-500 text-white bg-white/5 rounded-b-lg focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-white" aria-hidden="true" />
                </span>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-gray-400">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:text-primary/90">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:text-primary/90">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register

