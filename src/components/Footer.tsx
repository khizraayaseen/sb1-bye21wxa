import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const links = [
    { label: 'PRIVACY', href: '/privacy' },
    { label: 'TERMS', href: '/terms' },
    { label: 'GETTING STARTED', href: '/register' },
    { label: 'FAQ', href: '/faq' }
  ];

  return (
    <footer className="border-t border-white/10 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400">© 2025 WinProd AI. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;