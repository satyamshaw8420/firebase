import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { TripPreferences, BudgetType, TransportMode, Itinerary, TravelerCount, TravelerType, SavedTrip } from '../types';
import { generateItinerary } from '../services/geminiService';
import { ItineraryView } from '../components/ItineraryView';
import { addTrip, updateTrip } from '../firebase/tripService';
import { useAuth } from '../contexts/AuthContext';
import { toast, Toaster } from 'sonner';

import { 
  Loader2, Plus, Minus, MapPin, Wallet, X, 
  Plane, Train, Bus, Ship, Car, User, Baby, Users, Armchair, 
  Landmark, Camera, Utensils, Tent, ShoppingBag, Heart, Beer, Home, Sparkles, Calendar, Image as ImageIcon
} from 'lucide-react';

const { useLocation } = ReactRouterDOM;

const CreateTrip: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [tempDest, setTempDest] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Branding Colors
  const COLORS = {
    primary: '#015F63', // Deep Teal
    secondary: '#4FC3F7', // Sky Blue
    primaryLight: '#E0F2F1',
    secondaryLight: '#E1F5FE'
  };

  const [prefs, setPrefs] = useState<TripPreferences>({
    origin: '',
    destination: '',
    additionalDestinations: [],
    startDate: '',
    endDate: '',
    durationDays: 0,
    budgetType: BudgetType.MODERATE,
    budgetAmount: 0,
    travelerType: TravelerType.SOLO,
    joinStrangerGroup: false,
    groupPreferences: { genderPreference: 'any' },
    travelers: { adults: 0, children: 0, seniors: 0, infants: 0 },
    transportModes: [],
    hireGuide: false,
    interests: []
  });

  // Check for edit mode
  useEffect(() => {
    if (location.state?.editTrip) {
        const trip = location.state.editTrip as SavedTrip;
        // Ensure groupPreferences exists for backward compatibility
        const updatedPreferences = {
            ...trip.preferences,
            groupPreferences: trip.preferences.groupPreferences || { genderPreference: 'any' }
        };
        setPrefs(updatedPreferences);
        setEditingId(trip.id);
        // Optionally scroll to top
        window.scrollTo(0, 0);
    }
  }, [location]);

  // Calculate duration whenever dates change
  useEffect(() => {
    if (prefs.startDate && prefs.endDate) {
      const start = new Date(prefs.startDate);
      const end = new Date(prefs.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
      setPrefs(prev => ({ ...prev, durationDays: diffDays > 0 ? diffDays : 0 }));
    }
  }, [prefs.startDate, prefs.endDate]);

  // Reset logic when switching traveler types
  useEffect(() => {
    if (prefs.travelerType !== TravelerType.SOLO && prefs.travelerType !== TravelerType.FRIENDS) {
        setPrefs(p => ({ ...p, joinStrangerGroup: false }));
    }
  }, [prefs.travelerType]);

  const handleDestAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tempDest.trim()) {
      e.preventDefault();
      // Validate destination before adding
      if (isValidDestination(tempDest.trim())) {
        addDestination(tempDest.trim());
      } else {
        toast.error('Please select a destination from the suggestions or enter a valid city name.');
      }
    }
  };

  // Add validation function for destinations
  const isValidDestination = (dest: string): boolean => {
    // Prevent completely empty or whitespace-only entries
    if (dest.trim().length === 0) {
      return false;
    }
    
    // Check if it's in our popular destinations list (exact match or partial match)
    const isPopular = POPULAR_DESTINATIONS.some(d => 
      d.toLowerCase().includes(dest.toLowerCase())
    );
    
    // Additional validation: Check if it looks like a real place name
    // (contains at least one letter and doesn't consist only of random characters)
    const hasValidCharacters = /^[a-zA-Z\s,\-.'()&]+$/.test(dest.trim());
    
    // Allow if it's in popular destinations or looks like a valid place name
    return isPopular || hasValidCharacters;
  };

  const addDestination = (dest: string) => {
      // Avoid duplicates
      const allDests = [prefs.destination, ...prefs.additionalDestinations].filter(Boolean);
      if (allDests.some(d => d.toLowerCase() === dest.toLowerCase())) return;

      if (!prefs.destination) {
        setPrefs(p => ({ ...p, destination: dest }));
      } else {
        setPrefs(p => ({ ...p, additionalDestinations: [...p.additionalDestinations, dest] }));
      }
      setTempDest('');
  };

  const handleRemoveDestination = (index: number) => {
      // Get current list of all visual destinations
      const currentDestinations = [prefs.destination, ...prefs.additionalDestinations].filter(Boolean);
      
      // Remove the item at the specific index
      const newDestinations = currentDestinations.filter((_, i) => i !== index);
      
      // Update state
      setPrefs(p => ({
          ...p,
          destination: newDestinations[0] || '',
          additionalDestinations: newDestinations.slice(1)
      }));
  };

  const updateTraveler = (type: keyof TravelerCount, delta: number) => {
    setPrefs(p => ({
      ...p,
      travelers: {
        ...p.travelers,
        [type]: Math.max(0, p.travelers[type] + delta)
      }
    }));
  };

  const toggleTransport = (mode: TransportMode) => {
    setPrefs(p => {
      const modes = p.transportModes.includes(mode)
        ? p.transportModes.filter(m => m !== mode)
        : [...p.transportModes, mode];
      return { ...p, transportModes: modes };
    });
  };

  const toggleInterest = (interest: string) => {
    setPrefs(p => {
      const list = p.interests.includes(interest)
        ? p.interests.filter(i => i !== interest)
        : [...p.interests, interest];
      return { ...p, interests: list };
    });
  };

  const handleGenerate = async () => {
    // Auto-add pending destination if user typed it but didn't press Enter
    let finalPrefs = { ...prefs };
    if (tempDest.trim()) {
      // Validate before auto-adding
      if (isValidDestination(tempDest.trim())) {
          const allDests = [finalPrefs.destination, ...finalPrefs.additionalDestinations].filter(Boolean);
          // Only add if not duplicate
          if (!allDests.some(d => d.toLowerCase() === tempDest.trim().toLowerCase())) {
              if (!finalPrefs.destination) {
                  finalPrefs.destination = tempDest.trim();
              } else {
                  finalPrefs.additionalDestinations = [...finalPrefs.additionalDestinations, tempDest.trim()];
              }
          }
          // Sync state
          setPrefs(finalPrefs);
          setTempDest('');
      } else {
          toast.error('Please select a destination from the suggestions or enter a valid city name.');
          return;
      }
  }

    console.log("Submitting Trip Preferences (JSON):", JSON.stringify(finalPrefs, null, 2));

    // Check for required fields
    if (!finalPrefs.origin) {
        toast.error('Please fill in the required field: Starting Point.');
        return;
    }
    
    if (!finalPrefs.destination) {
        toast.error('Please add at least one destination.');
        return;
    }
    
    if (!finalPrefs.startDate) {
        toast.error('Please select a start date.');
        return;
    }
    
    if (!finalPrefs.endDate) {
        toast.error('Please select an end date.');
        return;
    }
    
    if (finalPrefs.transportModes.length === 0) {
        toast.error('Please select at least one transport mode.');
        return;
    }

    if (!currentUser) {
        toast.error('You must be logged in to create a trip.');
        return;
    }

    setLoading(true);
    try {
      const result = await generateItinerary(finalPrefs);
      setItinerary(result);
      
      if (editingId) {
          // Update existing trip in Firebase
          await updateTrip(editingId, { 
            ...result, 
            preferences: finalPrefs 
          });
          console.log("Trip updated successfully in Firebase");
      } else {
          // Create new trip in Firebase
          const newTrip = { 
            ...result, 
            createdAt: Date.now(), 
            preferences: finalPrefs,
            isBooked: false,
            userId: currentUser.uid
          };
          await addTrip(newTrip, currentUser.uid);
          console.log("New trip created successfully in Firebase:", newTrip);
      }
    } catch (err) {
      toast.error("Failed to generate trip. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Loading View ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Toaster position="top-right" richColors />
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
           <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className={`absolute inset-0 border-4 border-t-[${COLORS.primary}] border-r-[${COLORS.primary}] border-b-transparent border-l-transparent rounded-full animate-spin`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                  <Plane className={`w-8 h-8 text-[${COLORS.primary}]`} />
              </div>
           </div>
           
           <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{editingId ? 'Updating Your Trip' : 'Creating Your Itinerary'}</h2>
           <p className="text-gray-500 mb-6 text-lg">
             Our AI is finding the best spots in <span className={`text-[${COLORS.primary}] font-bold`}>{prefs.destination || 'your destination'}</span>...
           </p>
           
           <div className="flex justify-center gap-2">
              <span className={`w-2 h-2 rounded-full bg-[${COLORS.secondary}] animate-bounce`}></span>
              <span className={`w-2 h-2 rounded-full bg-[${COLORS.secondary}] animate-bounce delay-100`}></span>
              <span className={`w-2 h-2 rounded-full bg-[${COLORS.secondary}] animate-bounce delay-200`}></span>
           </div>
        </div>
      </div>
    );
  }

  // --- Render Result View ---
  if (itinerary) {
    return (
        <>
          <Toaster position="top-right" richColors />
          <ItineraryView 
              itinerary={itinerary}
              preferences={prefs} 
              onClose={() => {
                  setItinerary(null);
                  setEditingId(null);
                  // Optionally reset form if "Plan Another Trip" means clear everything
              }}
              closeLabel="Plan Another Trip" 
          />
        </>
    );
  }

  // --- Main Form Render ---
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
      <Toaster position="top-right" richColors />
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-10 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 border border-emerald-100">
          <div className="absolute -top-10 -left-10 w-56 h-56 bg-emerald-200/40 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-12 -right-16 w-72 h-72 bg-sky-200/40 blur-3xl rounded-full"></div>
          <div className="relative px-8 py-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-emerald-500/10 text-emerald-700 text-sm font-semibold border border-emerald-400/20">
              AI Trip Planner
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent mb-3">
              {editingId ? 'Edit Your Trip' : 'Plan Your Ultimate Journey'}
            </h1>
            <p className="text-gray-700 text-lg">Tell us where, when, and how—we'll handle the rest.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 backdrop-blur text-gray-700 text-sm border border-gray-200">
                <Plane className="w-4 h-4 text-emerald-600" /> Smart routes
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 backdrop-blur text-gray-700 text-sm border border-gray-200">
                <Wallet className="w-4 h-4 text-emerald-600" /> Budget-aware
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 backdrop-blur text-gray-700 text-sm border border-gray-200">
                <Users className="w-4 h-4 text-emerald-600" /> Collaborative
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-2 w-full bg-gradient-to-r from-gray-100 to-gray-200">
              <div className={`h-full w-1/3 bg-gradient-to-r from-emerald-500 to-sky-500`}></div>
          </div>
          
          <div className="p-8 space-y-12">
            
            {/* 1. Trip Basics */}
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className={`bg-[${COLORS.primaryLight}] p-2 rounded-lg`}>
                        <MapPin className={`text-[${COLORS.primary}]`} /> 
                    </div>
                    Trip Basics
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Origin */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Starting Point</label>
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-4 text-gray-400 group-focus-within:text-[#4FC3F7] transition-colors w-5 h-5" />
                            <input 
                                type="text"
                                placeholder="Where are you leaving from?"
                                className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4FC3F7] focus:border-[#4FC3F7] outline-none transition-all placeholder-gray-400 font-medium text-gray-900"
                                value={prefs.origin}
                                onChange={(e) => setPrefs({...prefs, origin: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Destinations Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Destinations</label>
                        <div className="relative group">
                            <SearchInput 
                                value={tempDest}
                                onChange={setTempDest}
                                onEnter={handleDestAdd}
                                onSelect={(val) => {
                                    addDestination(val);
                                    setTempDest('');
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Destinations Visual List */}
                {(prefs.destination || prefs.additionalDestinations.length > 0) && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[prefs.destination, ...prefs.additionalDestinations].filter(Boolean).map((dest, idx) => (
                           <div key={idx} className="relative group overflow-hidden rounded-xl h-32 cursor-pointer shadow-sm hover:shadow-md transition-all">
                               {/* Image Preview with Fallback */}
                               <img 
                                   src={`https://picsum.photos/seed/${dest.replace(/[^a-zA-Z0-9]/g, '')}/400/300`}
                                   alt={dest}
                                   className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                   onError={(e) => {
                                       (e.target as HTMLImageElement).style.display = 'none';
                                       (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                   }}
                               />
                               {/* Fallback if image fails or loading - though picsum is reliable */}
                               <div className="absolute inset-0 bg-gray-200 hidden flex-col items-center justify-center text-gray-400">
                                   <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                                   <span className="text-xs uppercase font-bold tracking-widest opacity-50">Preview</span>
                               </div>
                               
                               <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                               
                               <span className="absolute bottom-3 left-3 text-white font-bold text-lg leading-none z-10 capitalize">{dest}</span>
                               
                               <button 
                                    onClick={() => handleRemoveDestination(idx)}
                                    className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 backdrop-blur p-1.5 rounded-full text-white transition-colors z-20"
                               >
                                   <X className="w-3 h-3" />
                               </button>
                           </div>
                        ))}
                    </div>
                )}

                {/* Dates */}
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Start Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-4 text-gray-400 w-5 h-5 pointer-events-none" />
                            <input 
                                type="date"
                                className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4FC3F7] outline-none font-medium text-gray-700 cursor-pointer"
                                value={prefs.startDate}
                                onChange={(e) => setPrefs({...prefs, startDate: e.target.value})}
                            />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">End Date</label>
                         <div className="relative">
                            <Calendar className="absolute left-4 top-4 text-gray-400 w-5 h-5 pointer-events-none" />
                            <input 
                                type="date"
                                className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4FC3F7] outline-none font-medium text-gray-700 cursor-pointer"
                                value={prefs.endDate}
                                onChange={(e) => setPrefs({...prefs, endDate: e.target.value})}
                            />
                        </div>
                     </div>
                     <div className={`bg-[${COLORS.secondaryLight}] rounded-xl flex flex-col items-center justify-center border border-[#4FC3F7]/30 p-2`}>
                        <span className={`text-[${COLORS.primary}] font-bold text-3xl`}>{prefs.durationDays}</span>
                        <span className={`text-[${COLORS.primary}] text-xs font-bold uppercase tracking-wide`}>Total Days</span>
                     </div>
                </div>
            </section>

            <div className="border-b border-gray-100"></div>

            {/* 2. Traveler Type & Group Details */}
            <section>
                 <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className={`bg-[${COLORS.primaryLight}] p-2 rounded-lg`}>
                        <Users className={`text-[${COLORS.primary}]`} /> 
                    </div>
                    Traveler Details
                </h2>

                {/* Traveler Type Cards */}
                <div className="mb-8">
                     <label className="text-sm font-bold text-gray-700 mb-3 block">Who are you traveling with?</label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { type: TravelerType.SOLO, icon: User, label: 'Solo' },
                            { type: TravelerType.COUPLE, icon: Heart, label: 'Couple' },
                            { type: TravelerType.FAMILY, icon: Home, label: 'Family' },
                            { type: TravelerType.FRIENDS, icon: Beer, label: 'Friends' },
                        ].map((item) => (
                            <button
                                key={item.type}
                                onClick={() => setPrefs({...prefs, travelerType: item.type})}
                                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
                                    prefs.travelerType === item.type
                                    ? `border-[${COLORS.primary}] bg-[${COLORS.primaryLight}] text-[${COLORS.primary}] shadow-md scale-[1.02]`
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-[#4FC3F7]/50 hover:bg-gray-50'
                                }`}
                            >
                                <item.icon className={`w-8 h-8 mb-3 ${prefs.travelerType === item.type ? `text-[${COLORS.primary}]` : 'text-gray-400'}`} />
                                <span className="font-bold text-lg">{item.label}</span>
                            </button>
                        ))}
                     </div>
                </div>

                {/* CONDITIONAL FEATURE: STRANGERS UNITED */}
                {(prefs.travelerType === TravelerType.SOLO || prefs.travelerType === TravelerType.FRIENDS) && (
                    <div className="mb-8 animate-in zoom-in-95 duration-300 ease-out">
                        <div className={`
                            relative rounded-2xl border-2 p-4 sm:p-6 transition-all duration-500 overflow-hidden
                            ${prefs.joinStrangerGroup 
                                ? `bg-gradient-to-r from-violet-600 to-indigo-600 border-indigo-500 shadow-xl shadow-indigo-200` 
                                : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'}
                        `}>
                            {/* Decorative background shapes */}
                            {prefs.joinStrangerGroup && (
                                <>
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent"></div>
                                </>
                            )}

                            <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                                <div className={`p-4 rounded-full shrink-0 shadow-sm ${prefs.joinStrangerGroup ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-500'}`}>
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                        <h3 className={`text-lg sm:text-xl font-bold ${prefs.joinStrangerGroup ? 'text-white' : 'text-gray-800'}`}>
                                            Strangers United
                                        </h3>
                                        <span className="text-[10px] uppercase font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full tracking-wide whitespace-nowrap">Beta</span>
                                    </div>
                                    <p className={`text-sm mb-4 leading-relaxed ${prefs.joinStrangerGroup ? 'text-indigo-100' : 'text-gray-600'}`}>
                                        Why travel alone? Join a curated group of 10-15 like-minded explorers. Share costs, make friends, and stay safe.
                                    </p>
                                    
                                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={prefs.joinStrangerGroup}
                                                onChange={(e) => setPrefs({...prefs, joinStrangerGroup: e.target.checked})}
                                            />
                                            <div className={`w-12 h-6 sm:w-14 sm:h-8 bg-gray-300 peer-focus:outline-none rounded-full peer transition-colors duration-300 ease-in-out ${prefs.joinStrangerGroup ? 'bg-[#4FC3F7]' : ''}`}></div>
                                            <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 bg-white border border-gray-100 w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-transform duration-300 peer-checked:translate-x-5 sm:peer-checked:translate-x-6 shadow-sm"></div>
                                        </div>
                                        <span className={`font-bold transition-colors ${prefs.joinStrangerGroup ? 'text-white' : 'text-gray-500 group-hover:text-indigo-600'}`}>
                                            {prefs.joinStrangerGroup ? 'Count me in!' : 'Enable Group Tour'}
                                        </span>
                                    </label>
                                    
                                    {/* Gender Preference Selection - Only shown when Strangers United is enabled */}
                                    {prefs.joinStrangerGroup && (
                                        <div className="mt-4 sm:mt-6 pt-4 border-t border-white/20">
                                            <h4 className="text-sm font-bold mb-3 text-white">Group Preferences</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <button 
                                                    onClick={() => setPrefs({
                                                        ...prefs, 
                                                        groupPreferences: { 
                                                            ...prefs.groupPreferences, 
                                                            genderPreference: 'any' 
                                                        }
                                                    })}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${prefs.groupPreferences?.genderPreference === 'any' || !prefs.groupPreferences ? 'bg-white text-indigo-600 shadow' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                                >
                                                    Everyone
                                                </button>
                                                <button 
                                                    onClick={() => setPrefs({
                                                        ...prefs, 
                                                        groupPreferences: { 
                                                            ...prefs.groupPreferences, 
                                                            genderPreference: 'female' 
                                                        }
                                                    })}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${prefs.groupPreferences?.genderPreference === 'female' ? 'bg-white text-indigo-600 shadow' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                                >
                                                    Females Only
                                                </button>
                                                <button 
                                                    onClick={() => setPrefs({
                                                        ...prefs, 
                                                        groupPreferences: { 
                                                            ...prefs.groupPreferences, 
                                                            genderPreference: 'male' 
                                                        }
                                                    })}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${prefs.groupPreferences?.genderPreference === 'male' ? 'bg-white text-indigo-600 shadow' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                                >
                                                    Males Only
                                                </button>
                                            </div>
                                            <p className="text-xs mt-2 text-indigo-100/80">Choose your preferred group composition</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Group Member Counters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Adults', key: 'adults', icon: User, desc: '13+ yrs' },
                        { label: 'Children', key: 'children', icon: Baby, desc: '2-12 yrs' },
                        { label: 'Seniors', key: 'seniors', icon: Armchair, desc: '60+ yrs' },
                        { label: 'Infants', key: 'infants', icon: Baby, desc: '0-2 yrs' },
                    ].map((item) => (
                        <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center hover:border-[#4FC3F7] transition-all group">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{item.label}</span>
                            <div className={`p-2 rounded-full mb-2 text-[${COLORS.primary}] bg-[${COLORS.primaryLight}] group-hover:scale-110 transition-transform`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-gray-400 mb-4">{item.desc}</span>
                            
                            <div className="flex items-center justify-between w-full bg-gray-50 rounded-lg px-2 py-1">
                                <button 
                                    onClick={() => updateTraveler(item.key as keyof TravelerCount, -1)}
                                    className={`p-1.5 text-gray-400 hover:text-[${COLORS.primary}] hover:bg-white rounded-md transition-all`}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-bold text-lg text-gray-800">{prefs.travelers[item.key as keyof TravelerCount]}</span>
                                <button 
                                    onClick={() => updateTraveler(item.key as keyof TravelerCount, 1)}
                                    className={`p-1.5 text-gray-400 hover:text-[${COLORS.primary}] hover:bg-white rounded-md transition-all`}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="border-b border-gray-100"></div>

            {/* 3. Budget & Preferences */}
            <section>
                 <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className={`bg-[${COLORS.primaryLight}] p-2 rounded-lg`}>
                        <Wallet className={`text-[${COLORS.primary}]`} /> 
                    </div>
                    Budget & Style
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Budget Tier */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700">Comfort Level</label>
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                            {Object.values(BudgetType).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPrefs({...prefs, budgetType: type})}
                                    className={`flex-1 py-3 px-2 rounded-lg text-sm font-bold transition-all ${
                                        prefs.budgetType === type
                                        ? `bg-white text-[${COLORS.primary}] shadow-sm ring-1 ring-gray-200`
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Budget Amount */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700">Total Budget (INR)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-4 text-gray-500 font-bold">₹</span>
                            <input 
                                type="number" 
                                value={prefs.budgetAmount || ''}
                                placeholder="Enter your budget"
                                onChange={(e) => setPrefs({...prefs, budgetAmount: parseInt(e.target.value) || 0})}
                                className={`w-full pl-10 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4FC3F7] outline-none font-bold text-gray-800 tracking-wide placeholder-gray-400`}
                            />
                        </div>
                    </div>
                </div>

                {/* Transport */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700">Transport Preferences</label>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { mode: TransportMode.FLIGHT, icon: Plane },
                            { mode: TransportMode.TRAIN, icon: Train },
                            { mode: TransportMode.BUS, icon: Bus },
                            { mode: TransportMode.CAR, icon: Car },
                            { mode: TransportMode.CRUISE, icon: Ship },
                        ].map((item) => (
                             <button
                                key={item.mode}
                                onClick={() => toggleTransport(item.mode)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                                    prefs.transportModes.includes(item.mode)
                                    ? `bg-[${COLORS.primary}] text-white border-[${COLORS.primary}] shadow-md shadow-teal-900/10`
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#4FC3F7]'
                                }`}
                             >
                                 <item.icon className="w-5 h-5" />
                                 <span className="font-medium">{item.mode}</span>
                             </button>
                        ))}
                    </div>
                </div>
            </section>

             <div className="border-b border-gray-100"></div>

             {/* 4. Personalization */}
             <section>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className={`bg-[${COLORS.primaryLight}] p-2 rounded-lg`}>
                            <Camera className={`text-[${COLORS.primary}]`} /> 
                        </div>
                        Personalize
                    </h2>
                    
                    {/* Guide Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer group bg-gray-50 px-4 py-2 rounded-full border border-gray-200 hover:border-[#4FC3F7] transition-colors">
                        <span className="text-sm font-bold text-gray-600 group-hover:text-[#015F63] transition-colors">Hire Local Guide?</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={prefs.hireGuide}
                                onChange={(e) => setPrefs({...prefs, hireGuide: e.target.checked})}
                            />
                            <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[${COLORS.primary}]`}></div>
                        </div>
                    </label>
                </div>

                {/* Interest Tags */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700">Interests</label>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { name: 'History', icon: Landmark },
                            { name: 'Nature', icon: Tent },
                            { name: 'Food', icon: Utensils },
                            { name: 'Adventure', icon: MapPin },
                            { name: 'Shopping', icon: ShoppingBag },
                            { name: 'Photography', icon: Camera },
                            { name: 'Nightlife', icon: Beer },
                        ].map((item) => (
                             <button
                                key={item.name}
                                onClick={() => toggleInterest(item.name)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${
                                    prefs.interests.includes(item.name)
                                    ? `bg-[${COLORS.secondaryLight}] text-[${COLORS.primary}] border-[#4FC3F7]`
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                             >
                                 <item.icon className="w-4 h-4" />
                                 {item.name}
                             </button>
                        ))}
                    </div>
                </div>
             </section>

             {/* 5. Submit */}
             <div className="pt-6 pb-4">
                 <button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className={`w-full bg-[${COLORS.primary}] hover:opacity-90 text-white py-5 rounded-2xl font-extrabold text-xl shadow-xl shadow-teal-900/20 hover:shadow-2xl transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                 >
                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (editingId ? "Update Trip" : "Generate Trip")}
                 </button>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Destination Search Input
const POPULAR_DESTINATIONS = [
  // India
  "Mumbai, Maharashtra", "Delhi, India", "Bangalore, Karnataka", "Hyderabad, Telangana",
  "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Jaipur, Rajasthan", "Ahmedabad, Gujarat",
  "Pune, Maharashtra", "Goa, India", "Kerala, India", "Agra, Uttar Pradesh",
  "Varanasi, Uttar Pradesh", "Udaipur, Rajasthan", "Manali, Himachal Pradesh",
  "Shimla, Himachal Pradesh", "Leh Ladakh, India", "Rishikesh, Uttarakhand",
  "Munnar, Kerala", "Coorg, Karnataka", "Ooty, Tamil Nadu", "Darjeeling, West Bengal",
  "Gangtok, Sikkim", "Pondicherry, India", "Hampi, Karnataka", "Mysore, Karnataka",
  "Amritsar, Punjab", "Jaisalmer, Rajasthan", "Jodhpur, Rajasthan", "Kochi, Kerala",
  "Alleppey, Kerala", "Andaman and Nicobar Islands", "Srinagar, Kashmir",
  "Gulmarg, Kashmir", "Pahalgam, Kashmir", "Nainital, Uttarakhand",
  "Mussoorie, Uttarakhand", "Mahabaleshwar, Maharashtra", "Lonavala, Maharashtra",
  "Shillong, Meghalaya", "Kaziranga, Assam", "Tirupati, Andhra Pradesh",
  "Madurai, Tamil Nadu", "Rameswaram, Tamil Nadu", "Kanyakumari, Tamil Nadu",
  "Puri, Odisha", "Bhubaneswar, Odisha", "Konark, Odisha", "Khajuraho, Madhya Pradesh",
  "Indore, Madhya Pradesh", "Bhopal, Madhya Pradesh", "Lucknow, Uttar Pradesh",
  "Kanpur, Uttar Pradesh", "Nagpur, Maharashtra", "Surat, Gujarat", "Patna, Bihar",
  "Ranchi, Jharkhand", "Raipur, Chhattisgarh", "Chandigarh, India", "Guwahati, Assam",
  // International
  "Paris, France", "Bali, Indonesia", "Tokyo, Japan", "New York, USA", 
  "London, UK", "Rome, Italy", "Dubai, UAE", "Sydney, Australia", 
  "Santorini, Greece", "Maldives", "Swiss Alps, Switzerland",
  "Kyoto, Japan", "Bangkok, Thailand", "Singapore", "Istanbul, Turkey",
  "Barcelona, Spain", "Amsterdam, Netherlands", "Hong Kong", "Seoul, South Korea",
  "Phuket, Thailand", "Kathmandu, Nepal", "Colombo, Sri Lanka", "Bhutan"
];

const SearchInput = ({ value, onChange, onEnter, onSelect }: { value: string, onChange: (val: string) => void, onEnter: any, onSelect?: (val: string) => void }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    // Simple filter
    const filtered = POPULAR_DESTINATIONS.filter(d => 
        d.toLowerCase().includes(value.toLowerCase()) && value.trim().length > 0
    );

    return (
        <div className="relative group z-50">
            <MapPin className="absolute left-4 top-4 text-gray-400 group-focus-within:text-[#4FC3F7] transition-colors w-5 h-5 z-10" />
            <input 
                type="text"
                placeholder="Add destinations (Press Enter)"
                className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4FC3F7] focus:border-[#4FC3F7] outline-none transition-all placeholder-gray-400 font-medium text-gray-900"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={onEnter}
            />
            <div className="absolute right-4 top-3">
                 <div className="hidden group-focus-within:flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-400 font-medium">
                    <span>Press</span>
                    <span className="border border-gray-300 rounded px-1 min-w-[20px] text-center">↵</span>
                 </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && value && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-2">
                        {filtered.map((dest, i) => (
                            <div 
                                key={i} 
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 text-gray-700 transition-colors"
                                onClick={() => {
                                    onChange(dest);
                                    if(onSelect) onSelect(dest);
                                    setShowSuggestions(false);
                                }}
                            >
                                <div className="bg-gray-100 p-2 rounded-full">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="font-medium">{dest}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTrip;
