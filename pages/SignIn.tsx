import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { signInWithGooglePopup, signOutUser } from '../firebase/authService';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Confetti from 'react-confetti';
import { gsap } from 'gsap';
import { TypeAnimation } from "react-type-animation";

const { useNavigate, Link } = ReactRouterDOM;

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { currentUser } = useAuth();

  // Redirect authenticated users to home page
  useEffect(() => {
    if (currentUser) {
      toast.info('You have already signed up!');
      // Add a small delay to ensure toast is visible before redirecting
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  }, [currentUser, navigate]);

  // Mouse position state for trail effect
  const [trail, setTrail] = useState<{ id: number, x: number, y: number }[]>([]);

  // Mouse position state for 3D button effect
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, z: 0 });

  // Create refs for GSAP animations
  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const headerRef = useRef<HTMLHeadingElement>(null);
  const googleButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);


  // Handle mouse move for trail effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newTrail = [...trail, { id: Date.now(), x: e.clientX, y: e.clientY }];

      // Limit trail length to 5 elements for performance
      if (newTrail.length > 5) {
        newTrail.shift();
      }

      setTrail(newTrail);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [trail]);

  // Handle mouse move for 3D button effect
  const handleButtonMouseMove = (e: React.MouseEvent) => {
    if (googleButtonRef.current) {
      const rect = googleButtonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      // Calculate rotation based on mouse position
      const rotateY = (deltaX / rect.width) * 15; // Max 15 degrees rotation
      const rotateX = -(deltaY / rect.height) * 15; // Invert for natural feel

      // Calculate depth based on distance from center
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = Math.sqrt((rect.width/2) * (rect.width/2) + (rect.height/2) * (rect.height/2));
      const depth = (1 - distance / maxDistance) * 25; // Max 25px depth

      setButtonPosition({ x: rotateY, y: rotateX, z: depth });
    }
  };

  const handleButtonMouseLeave = () => {
    setButtonPosition({ x: 0, y: 0, z: 0 });
  };

  // GSAP Animations
  useEffect(() => {
    // Animate the card coming in
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
      );
    }

    // Animate the logo
    if (logoRef.current) {
      gsap.fromTo(logoRef.current,
        { opacity: 0, scale: 0.5, rotation: -10 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" }
      );
    }

    // Animate the header text
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: "power2.out" }
      );
    }

    // Animate the Google button
    if (googleButtonRef.current) {
      gsap.fromTo(googleButtonRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.6, delay: 0.6, ease: "power2.out" }
      );
    }

    // Animate the form elements
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.8, ease: "power2.out" }
      );
    }
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const user = await signInWithGooglePopup();

      // Log the full user object as requested
      console.log("User successfully logged in:", user);

      // Check if this is the user's first login
      const isFirstLogin = !localStorage.getItem('hasLoggedInBefore');

      // Show success toast
      toast.success(`Welcome, ${user.displayName || user.email}!`);

      // Show confetti for first-time login
      if (isFirstLogin) {
        setShowConfetti(true);
        localStorage.setItem('hasLoggedInBefore', 'true');
        // Hide confetti after 5 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
      }

      // Navigate to homepage
      navigate('/');
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      // Handle generic errors
      setError("Failed to sign in. Please try again.");
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-right" richColors />
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: 'url(/sign.png)' }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Confetti for first-time login */}
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} tweenDuration={10000} />}

      {/* Hero Text Overlay - hidden on mobile */}
      <div className="hidden md:block absolute top-[45%] left-12 -translate-y-1/2 text-white max-w-md z-10">
        <div className="bg-black bg-opacity-15 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
          {/* Looping auto-typing text */}
          <div className="text-5xl md:text-5xl font-bold leading-tight mb-6">
            <TypeAnimation
              sequence={[
                "", // Start with empty string
                900, // Delay before starting to type
                "Dost यहीं milte hain,\n\nSafar यहीं banta hai.\n\nTravelEase से shuruaat karo —\n\nTravel easy हो jaata hai.", // Full text
                2000, // How long to display the full text
                "", // Clear the text
                500, // Delay before starting again
              ]}
              speed={50}
              repeat={Infinity}
              cursor={true}
            />
          </div>
        </div>
      </div>

      {/* Mouse Trail Effect */}
      {trail.map((point) => (
        <div
          key={point.id}
          className="absolute w-1.5 h-1.5 rounded-full bg-white pointer-events-none"
          style={{
            left: point.x,
            top: point.y,
            opacity: 0.2,
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.2s',
          }}
        />
      ))}

      <div className="flex flex-col md:flex-row w-full max-w-6xl items-center">
        {/* Empty space on the left - hidden on mobile */}
        <div className="hidden md:block w-1/2 lg:w-2/3 flex-1"></div>

        {/* Sign-in form */}
        <div ref={cardRef} className="relative z-10 w-full md:w-auto max-w-sm md:max-w-md lg:max-w-lg p-4 flex justify-center">

          {/* Card */}
          <div className="w-full rounded-3xl shadow-xl overflow-hidden relative bg-white/10 backdrop-blur-md border border-white/20">
            <div className="p-5 pt-8">

              {/* Back Button - visible on mobile */}
              <Link to="/" className="inline-flex items-center text-white hover:text-gray-900 mb-6 transition-colors font-medium">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to Home
              </Link>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <img ref={logoRef} src="/travelease logo.png" alt="TravelEase" className="h-[100px] w-auto object-contain" />
                </div>
                <h1 ref={headerRef} className="text-xl font-bold text-gray-900 mb-2">Sign in to TravelEase</h1>
                <p className="text-gray-900 text-xl font-bold">Welcome back! Plan your next adventure with AI-powered ease.</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-3 h-3" /> {error}
                </div>
              )}

              {/* Google Button */}
              <div className="button-3d-container mb-3">
                <button
                  ref={googleButtonRef}  // Added ref
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  onMouseMove={handleButtonMouseMove}
                  onMouseLeave={handleButtonMouseLeave}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3.5 px-4 rounded-xl hover:bg-gray-100 hover:border-gray-500 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group relative transform hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    transform: `rotateX(${buttonPosition.y}deg) rotateY(${buttonPosition.x}deg) translateZ(${buttonPosition.z}px) scale(1.05)`,
                    transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
                    boxShadow: `0 ${buttonPosition.y * 0.5}px ${buttonPosition.y * 2}px rgba(0,0,0,0.2), 0 0 ${buttonPosition.z * 2}px rgba(1,95,99,0.3)`,
                  }}
                >
                  {googleLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-3 border-gray-400 border-t-blue-600 rounded-full animate-spin transition-all duration-300"></div>
                      <span className="font-medium text-blue-600">Signing in...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#4285F4"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span className="text-base transition-all duration-300 hover:text-blue-600 hover:drop-shadow-lg hover:drop-shadow-blue-500/50">Continue with Google</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-2 h-2 text-blue-500" /> Secure Login
                </p>
              </div>
            </div>

            {/* Footer of Card
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                    By continuing, you agree to TravelEase's <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
                </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
