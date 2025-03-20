"use client"

import type React from "react"
import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, Package, Users, LogOut, UserCircle, Mail, Send } from "lucide-react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error:", error)
    }
    navigate("/admin/login")
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Admins & Staff", href: "/admin/users", icon: Users },
    { name: "Customer Base", href: "/admin/customers", icon: UserCircle },
    { name: "Addons", href: "/admin/addons", icon: UserCircle },
    { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
    { name: "Email Marketing", href: "/admin/email-marketing", icon: Send },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Link to="/admin" className="flex items-center gap-2">
              <img src="https://i.postimg.cc/QxLkYX3X/Ecom-Degen-Logo.png" alt="Logo" className="h-8 w-8" />
              <span className="font-bold text-xl">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main>{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout

