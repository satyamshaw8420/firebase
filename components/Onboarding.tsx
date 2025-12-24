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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20 overflow-hidden relative">
        <style>{animationStyles}</style>
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-emerald-200/20 rounded-full blur-xl"></div>
        
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in-up">Welcome to Travel Community!</h1>
          <p className="text-gray-600 animate-fade-in-up delay-100">Let's set up your profile so you can connect with fellow travelers.</p>
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
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
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
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.handle ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
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
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.bio ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
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
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.location ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
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
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${errors.travelExperience ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
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
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
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