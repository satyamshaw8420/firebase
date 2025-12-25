import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Add animation styles
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
  }
  
  .delay-100 {
    animation-delay: 0.1s;
  }
  
  .delay-200 {
    animation-delay: 0.2s;
  }
  
  .delay-300 {
    animation-delay: 0.3s;
  }
  
  .transition-all-ease {
    transition: all 0.3s ease;
  }
  
  .hover-lift {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .hover-lift:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  }
`;

interface OnboardingFormData {
  name: string;
  handle: string;
  bio: string;
  location: string;
  interests: string[];
  travelExperience: string;
  profilePicture: string;
}

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: currentUser?.displayName || '',
    handle: `@${currentUser?.displayName?.toLowerCase().replace(/\s+/g, '') || 'traveler'}`,
    bio: '',
    location: '',
    interests: [],
    travelExperience: '',
    profilePicture: currentUser?.photoURL || 'https://i.pravatar.cc/150'
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const interestsOptions = [
    'Adventure', 'Beach', 'Culture', 'Food', 'Nature', 
    'Nightlife', 'Shopping', 'History', 'Relaxation', 'Sports'
  ];

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
    // Clear error when user selects an interest
    if (errors.interests) {
      setErrors(prev => ({ ...prev, interests: '' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        }
        if (!formData.handle.trim()) {
          newErrors.handle = 'Handle is required';
        } else if (!formData.handle.startsWith('@')) {
          newErrors.handle = 'Handle must start with @';
        }
        if (!formData.bio.trim()) {
          newErrors.bio = 'Bio is required';
        }
        break;
      case 2:
        if (!formData.location.trim()) {
          newErrors.location = 'Location is required';
        }
        if (!formData.travelExperience) {
          newErrors.travelExperience = 'Please select your travel experience';
        }
        break;
      case 3:
        if (selectedInterests.length === 0) {
          newErrors.interests = 'Please select at least one interest';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate step 3 before submitting
    if (!validateStep(3)) return;
    
    if (!currentUser) return;
    
    try {
      // Save user profile data to Firestore
      const userData = {
        ...formData,
        interests: selectedInterests,
        uid: currentUser.uid,
        email: currentUser.email,
        createdAt: new Date(),
        onboardingCompleted: true,
        followers: 0,
        following: 0,
        trips: 0,
        posts: []
      };
      
      // Use setDoc to either create a new document or overwrite existing one
            await setDoc(doc(db, 'users', currentUser.uid), userData);
      
      // Call onComplete callback to notify parent component
      onComplete();
    } catch (error) {
      console.error('Error saving user data:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-teal-100 to-cyan-200 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white/90 to-emerald-100/70 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/40 overflow-hidden relative">
        <style>{`
          ${animationStyles}
          
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-12px) translateX(5px); }
            50% { transform: translateY(-8px) translateX(-5px); }
            75% { transform: translateY(-15px) translateX(3px); }
          }
          
          @keyframes floatSlower {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-18px) translateX(-8px); }
            50% { transform: translateY(-10px) translateX(10px); }
            75% { transform: translateY(-20px) translateX(-5px); }
          }
          
          @keyframes floatRandom {
            0% { transform: translateY(0) translateX(0) rotate(0deg); }
            25% { transform: translateY(-15px) translateX(10px) rotate(5deg); }
            50% { transform: translateY(-5px) translateX(-10px) rotate(-5deg); }
            75% { transform: translateY(-20px) translateX(5px) rotate(3deg); }
            100% { transform: translateY(0) translateX(0) rotate(0deg); }
          }
          
          @keyframes floatRandom2 {
            0% { transform: translateY(0) translateX(0) rotate(0deg); }
            20% { transform: translateY(-10px) translateX(-8px) rotate(-3deg); }
            40% { transform: translateY(-18px) translateX(12px) rotate(7deg); }
            60% { transform: translateY(5px) translateX(-15px) rotate(-5deg); }
            80% { transform: translateY(-12px) translateX(7px) rotate(4deg); }
            100% { transform: translateY(0) translateX(0) rotate(0deg); }
          }
          
          @keyframes floatRandom3 {
            0% { transform: translateY(0) translateX(0) rotate(0deg); }
            30% { transform: translateY(-20px) translateX(15px) rotate(6deg); }
            50% { transform: translateY(8px) translateX(-10px) rotate(-4deg); }
            70% { transform: translateY(-5px) translateX(12px) rotate(5deg); }
            100% { transform: translateY(0) translateX(0) rotate(0deg); }
          }
          
          .animate-float-slow {
            animation: floatSlow 6s ease-in-out infinite;
          }
          
          .animate-float-slower {
            animation: floatSlower 9s ease-in-out infinite;
          }
          
          .animate-float-random {
            animation: floatRandom 8s ease-in-out infinite;
          }
          
          .animate-float-random2 {
            animation: floatRandom2 10s ease-in-out infinite;
          }
          
          .animate-float-random3 {
            animation: floatRandom3 7s ease-in-out infinite;
          }
        `}</style>
        {/* ===== Decorative Background Layer ===== */}
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        
          {/* Large ambient glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-emerald-400/40 via-cyan-400/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-blue-400/40 via-teal-400/30 to-transparent rounded-full blur-3xl" />
        
          {/* Floating orbs */}
          <div className="absolute top-1/3 -left-10 w-24 h-24 bg-emerald-400/50 rounded-full blur-xl animate-float-random" />
          <div className="absolute bottom-1/4 -right-12 w-28 h-28 bg-cyan-300/50 rounded-full blur-xl animate-float-random2" />
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-teal-300/40 rounded-full blur-lg animate-float-random3" />
        
          {/* Subtle grid texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.04)_1px,transparent_0)] bg-[size:24px_24px] opacity-30" />
        </div>
        
        {/* ===== Header Content ===== */}
        <div className="relative z-10 text-center mb-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full
                          bg-emerald-500/10 text-emerald-700 text-sm font-medium
                          backdrop-blur-md border border-emerald-400/20">
            🌍 Travel Community
          </div>
        
          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight
                         bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700
                         bg-clip-text text-transparent
                         animate-fade-in-up">
            Welcome, Explorer
          </h1>
        
          {/* Subtitle */}
          <p className="mt-3 max-w-md mx-auto text-gray-600 text-sm md:text-base
                        animate-fade-in-up delay-100">
            Build your travel identity and connect with people who don’t cancel plans last minute.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8 relative z-10">
          <div className="flex space-x-4">
            {[1, 2, 3].map((num) => (
              <div 
                key={num} 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all-ease ${step >= num ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-6 animate-fade-in-up delay-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Basic Information</h2>
              
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <img 
                    src={formData.profilePicture} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white text-sm font-bold">+</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.name ? 'border-red-500 bg-red-50' : 'border-emerald-200 bg-white/70 focus:bg-white'}`}
                    required
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span className="text-lg">⚠️</span> {errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Handle</label>
                  <input
                    type="text"
                    name="handle"
                    value={formData.handle}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.handle ? 'border-red-500 bg-red-50' : 'border-emerald-200 bg-white/70 focus:bg-white'}`}
                    required
                  />
                  {errors.handle && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span className="text-lg">⚠️</span> {errors.handle}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.bio ? 'border-red-500 bg-red-50' : 'border-emerald-200 bg-white/70 focus:bg-white'}`}
                    placeholder="Tell us about yourself..."
                    required
                  />
                  {errors.bio && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span className="text-lg">⚠️</span> {errors.bio}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up delay-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Location & Experience</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.location ? 'border-red-500 bg-red-50' : 'border-emerald-200 bg-white/70 focus:bg-white'}`}
                    placeholder="City, Country"
                    required
                  />
                  {errors.location && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span className="text-lg">⚠️</span> {errors.location}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Travel Experience</label>
                  <select
                    name="travelExperience"
                    value={formData.travelExperience}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.travelExperience ? 'border-red-500 bg-red-50' : 'border-emerald-200 bg-white/70 focus:bg-white'}`}
                    required
                  >
                    <option value="">Select your experience level</option>
                    <option value="beginner">Beginner (0-5 trips)</option>
                    <option value="intermediate">Intermediate (5-20 trips)</option>
                    <option value="experienced">Experienced (20+ trips)</option>
                    <option value="expert">Expert Traveler</option>
                  </select>
                  {errors.travelExperience && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span className="text-lg">⚠️</span> {errors.travelExperience}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in-up delay-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Your Interests</h2>
              <p className="text-gray-600 mb-6 text-center">Select your travel interests to help us connect you with like-minded travelers.</p>
              
              <div className="grid grid-cols-2 gap-4">
                {interestsOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-300 hover-lift ${
                      selectedInterests.includes(interest)
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-md'
                        : 'bg-gradient-to-br from-white/70 to-emerald-50/40 border-emerald-200 text-gray-700 hover:from-white/90 hover:to-emerald-100/60'}`}
                    
                  >
                    {interest}
                  </button>
                ))}
              </div>
              {errors.interests && <p className="text-red-500 text-xs mt-1 flex items-center gap-1 text-center justify-center"><span className="text-lg">⚠️</span> {errors.interests}</p>}
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                form="no-form"
                onClick={() => {
                  setStep(step - 1);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all duration-300 hover-lift"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep(step)) {
                    setStep(step + 1);
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 hover-lift shadow-md"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 hover-lift shadow-md"
              >
                Complete Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;