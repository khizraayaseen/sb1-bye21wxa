import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; // Import Supabase instance
import { checkIsAdmin } from "../../lib/utils";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoader, setAuthLoader] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const checkInitial = async () => {
      try {
        setAuthLoader(true); 

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setAuthLoader(false);
          return;
        }

        const sessionUserId = session.user.id;

        const isAdmin = await checkIsAdmin(sessionUserId);

        if (isAdmin) {
          navigate("/admin");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setAuthLoader(false);
      }
    };

    checkInitial();
  }, []);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let isAdmin: any = false;
    setError("");
    setLoading(true);

    try {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) throw new Error(signInError.message);
      isAdmin = await checkIsAdmin(signInData?.user?.id);
      if (!isAdmin) throw new Error("Unauthorized: Not an admin");

      navigate("/admin");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            className="mx-auto h-12 w-auto"
            src="https://i.postimg.cc/QxLkYX3X/Ecom-Degen-Logo.png"
            alt="Logo"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to admin panel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Don't have an admin account?{" "}
            <Link
              to="/admin/register"
              className="font-medium text-primary hover:text-primary/90"
            >
              Sign up
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AdminLogin;
