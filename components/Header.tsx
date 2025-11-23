import React, { useState, useCallback } from 'react';
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

  /**
   * Handles navigation to anchor links within the single-page application,
   * supporting both smooth scrolling on the home page and navigation from admin pages.
   * @param e - The mouse event from the anchor tag.
   * @param targetId - The ID of the target element to scroll to (e.g., '#cars').
   */
  const handleSpaLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();

    const isAtAdminPage = window.location.hash.startsWith('#/admin');

    if (isAtAdminPage) {
      // If on an admin page, navigate to the home page URL with the hash.
      // App.tsx will switch the view, and the browser will handle scrolling.
      window.location.hash = targetId;
    } else {
      // If already on the home page, perform a smooth scroll.
      const element = document.querySelector(targetId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // The history.pushState call has been removed to prevent SecurityErrors in sandboxed environments.
      } else {
        // Fallback for safety, though should rarely be needed.
        window.location.hash = targetId;
      }
    }
    
    // Close the mobile menu if it's open
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMenuOpen]);


  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="#/" onClick={(e) => handleNavigate(e, '#/')} aria-label="RP Cars Home">
            {/* New Animated SVG Logo */}
            <svg viewBox="0 0 205 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-9 w-auto">
                <defs>
                    <linearGradient id="logo-anim-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366F1"/>
                        <stop offset="50%" stopColor="#8B5CF6"/>
                        <stop offset="100%" stopColor="#6366F1"/>
                    </linearGradient>
                </defs>
                <g className="logo-animation-paths" fill="transparent" stroke="url(#logo-anim-gradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    {/* R */}
                    <path d="M10 40 V 10 H 25 C 40 10, 40 25, 25 25 H 10 M 25 25 L 40 40"/>
                    {/* P */}
                    <path d="M50 40 V 10 H 65 C 80 10, 80 25, 65 25 H 50"/>
                    {/* C */}
                    <path d="M100 40 C 85 40, 85 10, 100 10"/>
                    {/* A */}
                    <path d="M115 40 L 125 10 L 135 40 M 118 30 H 132"/>
                    {/* R */}
                    <path d="M145 40 V 10 H 160 C 175 10, 175 25, 160 25 H 145 M 160 25 L 175 40"/>
                    {/* S */}
                    <path d="M195 10 C 180 10, 180 25, 190 25 C 200 25, 200 40, 185 40"/>
                </g>
            </svg>
            <span className="sr-only">RP CARS</span> {/* For accessibility */}
        </a>

        <nav className="hidden lg:flex items-center space-x-8">
          {navLinks.map(link => (
            <a 
              key={link.label} 
              href={link.href}
              onClick={(e) => handleSpaLinkClick(e, link.href)}
              className="text-foreground hover:text-primary transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center space-x-4">
          {user ? (
            <>
              {isAdmin ? (
                <a href="#/admin" onClick={(e) => handleNavigate(e, '#/admin')} className="px-4 py-2 rounded-lg text-white bg-accent hover:opacity-90 transition-all duration-300 font-semibold">
                  Admin Panel
                </a>
              ) : (
                <a href="#/dashboard" onClick={(e) => handleNavigate(e, '#/dashboard')} className="px-4 py-2 rounded-lg text-primary-hover font-semibold hover:bg-gray-100 transition-all">
                  My Account
                </a>
              )}
              <span className="text-sm text-gray-600 truncate max-w-xs hidden md:inline">{user.email}</span>
              <button onClick={signOut} className="px-4 py-2 rounded-lg text-primary border border-primary hover:bg-primary hover:text-white transition-all duration-300">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">+91 8897072640</span>
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
            <a 
              key={link.label} 
              href={link.href} 
              onClick={(e) => handleSpaLinkClick(e, link.href)} 
              className="text-foreground hover:text-primary transition-colors duration-300 text-lg">
              {link.label}
            </a>
          ))}
          <div className="border-t w-full my-2"></div>
           {user ? (
            <>
              {isAdmin ? (
                  <a href="#/admin" onClick={(e) => handleNavigate(e, '#/admin')} className="w-3/4 text-center px-4 py-2 rounded-lg text-white bg-accent hover:opacity-90 transition-all duration-300 font-semibold">
                    Admin Panel
                  </a>
              ) : (
                <a href="#/dashboard" onClick={(e) => handleNavigate(e, '#/dashboard')} className="w-3/4 text-center px-4 py-2 rounded-lg text-primary-hover font-semibold hover:bg-gray-100 transition-all">
                  My Account
                </a>
              )}
              <span className="text-sm text-gray-600 truncate max-w-xs">{user.email}</span>
              <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="w-3/4 px-4 py-2 rounded-lg text-primary border border-primary hover:bg-primary hover:text-white transition-all duration-300">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground text-lg">+91 8897072640</span>
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

export default React.memo(Header);