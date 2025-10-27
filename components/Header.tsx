

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSignInClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSignInClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, role } = useAuth();

  const navLinks = [
    { href: '#cars', label: 'Browse Cars' },
    { href: '#features', label: 'About' },
    { href: '#contact', label: 'Contact' },
  ];
  
  const isAdmin = role === 'admin';

  /**
   * Handles SPA navigation using URL hash to avoid full page reloads.
   * @param e - The mouse event from the anchor tag.
   * @param hash - The target hash (e.g., '#/admin' or '#/').
   */
  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    window.location.hash = hash;
    // Close the mobile menu if it's open
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="#/" onClick={(e) => handleNavigate(e, '#/')} className="text-2xl font-bold text-foreground">RP CARS</a>

        <nav className="hidden lg:flex items-center space-x-8">
          {navLinks.map(link => (
            <a key={link.label} href={link.href} className="text-foreground hover:text-primary transition-colors duration-300 relative group">
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center space-x-4">
          {user ? (
            <>
              {isAdmin && (
                <a href="#/admin" onClick={(e) => handleNavigate(e, '#/admin')} className="px-4 py-2 rounded-lg text-white bg-accent hover:opacity-90 transition-all duration-300 font-semibold">
                  Admin Panel
                </a>
              )}
              <span className="text-sm text-gray-600 truncate max-w-xs">{user.email}</span>
              <button onClick={signOut} className="px-4 py-2 rounded-lg text-primary border border-primary hover:bg-primary hover:text-white transition-all duration-300">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">+91 12345 67890</span>
              <button onClick={onSignInClick} className="px-4 py-2 rounded-lg text-primary border border-primary hover:bg-primary hover:text-white transition-all duration-300">
                Sign In
              </button>
              <button onClick={onSignInClick} className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-all duration-300 shadow-sm hover:shadow-md">
                Get Started
              </button>
            </>
          )}
        </div>

        <div className="lg:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="text-foreground focus:outline-none"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            aria-label="Toggle mobile navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div id="mobile-menu" className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'} absolute top-full left-0 w-full bg-white shadow-lg transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col items-center py-4 space-y-4">
          {navLinks.map(link => (
            <a key={link.label} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-foreground hover:text-primary transition-colors duration-300 text-lg">
              {link.label}
            </a>
          ))}
          <div className="border-t w-full my-2"></div>
           {user ? (
            <>
              {isAdmin && (
                  <a href="#/admin" onClick={(e) => handleNavigate(e, '#/admin')} className="w-3/4 text-center px-4 py-2 rounded-lg text-white bg-accent hover:opacity-90 transition-all duration-300 font-semibold">
                    Admin Panel
                  </a>
              )}
              <span className="text-sm text-gray-600 truncate max-w-xs">{user.email}</span>
              <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="w-3/4 px-4 py-2 rounded-lg text-primary border border-primary hover:bg-primary hover:text-white transition-all duration-300">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground text-lg">+91 12345 67890</span>
              <button onClick={() => { onSignInClick(); setIsMenuOpen(false); }} className="w-3/4 px-4 py-2 rounded-lg text-primary border border-primary hover:bg-primary hover:text-white transition-all duration-300">
                Sign In
              </button>
              <button onClick={() => { onSignInClick(); setIsMenuOpen(false); }} className="w-3/4 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-all duration-300 shadow-sm hover:shadow-md">
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;