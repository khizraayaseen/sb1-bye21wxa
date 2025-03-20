import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { IoLogoTiktok } from "react-icons/io5";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  MessageCircle,
  X,
  Menu,
  ChevronDown,
  Youtube,
  Twitter,
  Facebook,
  Instagram,
  Bookmark,
  LogOut,
  Crown,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface SidebarProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose, onOpen }: SidebarProps) => {
  const navigate = useNavigate();
  const [showResourcesDropdown, setShowResourcesDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userName, setUserName] = useState("Guest User");

  const mainNavItems = [
    { icon: LayoutDashboard, label: "WinProd Board", path: "/dashboard" },
    { icon: Bookmark, label: "Saved Products", path: "/saved-products" },
    { icon: BookOpen, label: "WinProd E-Books", path: "/ebooks" },
  ];

  const socialLinks = [
    { icon: Youtube, label: "Youtube", url: "https://youtube.com" },
    { icon: Twitter, label: "Twitter", url: "https://twitter.com" },
    { icon: Facebook, label: "Facebook", url: "https://facebook.com" },
    { icon: Instagram, label: "Instagram", url: "https://instagram.com" },
    { icon: IoLogoTiktok, label: "TikTok", url: "https://tiktok.com" },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
    navigate("/login");
  };

  // Get current user information
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        return;
      }

      const userEmail = session?.user?.email; // Get the user's email
      if (userEmail) {
        const { data: userData, error: userError } = await supabase
          .from("customers") // Change to 'customers' table
          .select("full_name") // Select the 'full_name' column
          .eq("email", userEmail) // Assuming 'email' is the column to match
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
          return;
        }
        if (userData.full_name === null) {
          // If userData is null, set userName to the part of the email before '@'
          const usernameFromEmail = userEmail.split("@")[0]; // Get the part before '@'
          console.log(
            "User data not found, using email prefix:",
            usernameFromEmail
          );
          setUserName(usernameFromEmail);
          return;
        }
        if (userData) {
          // If userData is found, set the full name
          setUserName(userData.full_name || "Guest User");
        }
      } else {
        console.log("No user email found, setting userName to 'Guest User'");
        setUserName("Guest User");
      }
    };

    fetchUser();
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => (isOpen ? onClose() : onOpen())}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white hover:bg-gray-100 rounded-lg shadow-md"
      >
        {isOpen ? (
          <X size={24} className="text-gray-600" />
        ) : (
          <Menu size={24} className="text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-screen w-64 bg-black text-white z-40
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 flex flex-col
      `}
      >
        {/* Logo and Main Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="mb-8">
              <img
                src="https://i.postimg.cc/3JQd5V6C/WINPROD-AI-Twitch-Banner-1.png"
                alt="WinProd AI"
                className="w-full h-auto px-2"
              />
            </div>

            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-900 hover:text-white"
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-800">
          <nav className="space-y-1">
            {/* Resources Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowResourcesDropdown(!showResourcesDropdown)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-colors
                  ${
                    showResourcesDropdown
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:bg-gray-900 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Layers size={18} />
                  <span className="text-sm font-medium">Resources</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transform transition-transform duration-200 ${
                    showResourcesDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {showResourcesDropdown && (
                <div className="mt-1 py-1 px-2 bg-gray-800 rounded-lg">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <link.icon size={18} />
                      <span className="text-sm font-medium">{link.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Support Link */}
            <NavLink
              to="/support"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-900 hover:text-white"
                }`
              }
            >
              <MessageCircle size={18} />
              <span className="text-sm font-medium">Support</span>
            </NavLink>
          </nav>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800 bg-black">
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">G</span>
                </div>
                <div>
                  <div className="text-sm font-medium">{userName}</div>
                  <div className="text-xs text-gray-400">Free Member</div>
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transform transition-transform duration-200 ${
                  showUserDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  <Crown size={18} className="text-[#FFD700]" />
                  <span>Upgrade to Pro</span>
                </button>
                <button
                  onClick={() => navigate("/account")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  <User size={18} />
                  <span>WinProd Account</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors border-t border-gray-700"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
