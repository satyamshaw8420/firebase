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
                <p className="text-gray-400 text-sm">Travel Made Effortless. AI-powered itineraries, verified guides, and a community of explorers.</p>
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