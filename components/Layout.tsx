import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Plane, Map, LayoutGrid, Users, Menu, X, UserCircle, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../firebase/authService';
import { toast } from 'react-toastify';

const { Link, useLocation } = ReactRouterDOM;

interface LayoutProps {
  children: React.ReactNode;
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/signin';
  const { currentUser, logout } = useAuth();

  // Hide Navbar on Auth Pages if desired, or just simplify it. 
  // For now, we will render it but hide the Sign In button if we are on the Sign In page.
  
  const navLinks = useMemo(() => [
    { path: '/', label: 'Home', icon: <Globe size={18} /> },
    ...(currentUser ? [{ path: '/create-trip', label: 'Create Trip', icon: <Plane size={18} /> }] : []),
    { path: '/my-trips', label: 'My Trips', icon: <LayoutGrid size={18} /> },
    { path: '/destination', label: 'Destinations', icon: <Map size={18} /> },
    { path: '/compare', label: 'Compare', icon: <Users size={18} /> },
    { path: '/guides', label: 'Guides', icon: <UserCircle size={18} /> },
    { path: '/community', label: 'Community', icon: <Users size={18} /> },
    { path: '/faq', label: 'FAQ', icon: <Users size={18} /> },
    { path: '/contact', label: 'Contact', icon: <Users size={18} /> },
  ], [currentUser]);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOutUser();
      logout();
      toast.success('You have been signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  if (isAuthPage) return null; // Fully hide layout navbar on Sign In page for a clean look

  return (
    <nav className="bg-white/50 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-y-2">
              <span>
                <img src="/travelease logo.png" alt="TravelEase Logo" className="h-20 w-[120px] object-contain z-50 " /></span>
              <span className="font-bold text-xl text-gray-900 tracking-tight transition-transform duration-200 hover:scale-105"></span>
            
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-0 py-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive(link.path)
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-500'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-9">
            {currentUser ? (
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium transition-all shadow-md shadow-emerald-200"
              >
                <UserCircle size={18} />
                <span >Sign Out</span>
              </button>
            ) : (
              <Link 
                to="/signin"
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md shadow-emerald-200"
              >
                <UserCircle size={18} />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium whitespace-nowrap ${
                   isActive(link.path)
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-500'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {currentUser ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md shadow-emerald-200"
              >
                <UserCircle size={18} />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/signin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md shadow-emerald-200"
              >
                <UserCircle size={18} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer: React.FC = () => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/signin';
    if(isAuthPage) return null;

    return (
        <footer className="bg-gray-900 text-white py-12 mt-auto border-t border-gray-700 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <div className="flex items-center gap-3 mb-6">
                <img src="/travelease logo.png" alt="TravelEase Logo" className="h-20 w-[120px] object-contain bg-black/10 rounded-lg p-1 hover:scale-105 transition-transform duration-200" />
                <span className="font-bold text-2xl">TravelEase</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">Travel Made Effortless. AI-powered itineraries, verified guides, and a community of explorers.</p>
                <div className="flex space-x-4">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
            </div>
            <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">About Us</li>
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">Careers</li>
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">Blog</li>
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">Partners</li>
                </ul>
            </div>
            <div>
                <h3 className="font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">Help Center</li>
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">Safety Information</li>
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">Cancellation Options</li>
                </ul>
            </div>
            <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">Privacy Policy</li>
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">Terms of Service</li>
                <li className="hover:scale-105 hover:text-emerald-400 cursor-pointer">Sitemap</li>
                </ul>
            </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} TravelEase Inc. All rights reserved.
            </div>
        </footer>
    );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};