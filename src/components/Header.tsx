import React, { useState } from 'react';
import { Bell, Search, User, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {supabase } from '../lib/supabase';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('mockUser') !== null;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Sign out error:', error);
      }
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setShowSearch(false)} />
      )}
      
      <header className="fixed top-0 right-0 left-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden">
        {/* Main Header */}
        <div className="h-16 bg-black/95 border-b border-white/10 w-full">
          <div className="h-full px-4 md:px-6 flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-white hover:text-primary transition-colors"
              >
                <Menu size={24} />
              </button>
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src="https://i.postimg.cc/3JQd5V6C/WINPROD-AI-Twitch-Banner-1.png" 
                  alt="WinProd AI"
                  className="h-16 w-auto"
                />
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <button 
                  onClick={handleLogout}
                  className="text-white hover:text-primary transition-colors"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="text-white hover:text-primary transition-colors"
                  >
                    Login
                  </Link>
                  <button 
                    onClick={() => navigate('/register')}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;