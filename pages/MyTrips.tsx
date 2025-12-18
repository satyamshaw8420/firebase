import React, { useEffect, useState } from 'react';
import { SavedTrip, Itinerary } from '../types';
import { Map, Calendar, ArrowRight, Download, Trash2, CloudOff, Edit2, CheckCircle } from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';
import { ItineraryView } from '../components/ItineraryView';
import { useAuth } from '../contexts/AuthContext';
import { getUserTrips, deleteTrip, updateTrip } from '../firebase/tripService';
import { getTravelImage, getRandomTravelImage } from '../services/unsplashService';

const { Link, useNavigate } = ReactRouterDOM;

const MyTrips: React.FC = () => {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Only load trips if user is authenticated
    const loadTrips = async () => {
      if (currentUser) {
        try {
          const userTrips = await getUserTrips(currentUser.uid);
          setTrips(userTrips);
        } catch (error) {
          console.error('Error loading trips:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadTrips();
  }, [currentUser]);

  const handleDeleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteTrip(id);
      const updated = trips.filter(t => t.id !== id);
      setTrips(updated);
      if (selectedTrip?.id === id) setSelectedTrip(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip. Please try again.');
    }
  };

  const handleEditRedirect = (trip: SavedTrip, e: React.MouseEvent) => {
      e.stopPropagation();
      navigate('/create-trip', { state: { editTrip: trip } });
  };

  const handleUpdateTrip = async (updatedItinerary: Itinerary) => {
      if (!selectedTrip) return;
      
      try {
        const updatedTrip = { ...selectedTrip, ...updatedItinerary };
        await updateTrip(selectedTrip.id, updatedTrip);
        
        const updatedTripsList = trips.map(t => t.id === selectedTrip.id ? updatedTrip : t);
        setTrips(updatedTripsList);
        setSelectedTrip(updatedTrip); // Update current view
      } catch (error) {
        console.error('Error updating trip:', error);
        alert('Failed to update trip. Please try again.');
      }
  };

  const handleBookTrip = async () => {
      if (!selectedTrip) return;
      
      try {
        const bookedTrip = { ...selectedTrip, isBooked: true };
        await updateTrip(selectedTrip.id, bookedTrip);
        
        const updatedTripsList = trips.map(t => t.id === selectedTrip.id ? bookedTrip : t);
        setTrips(updatedTripsList);
        setSelectedTrip(bookedTrip);
      } catch (error) {
        console.error('Error booking trip:', error);
        alert('Failed to book trip. Please try again.');
      }
  };

  // Show message if user is not authenticated
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <CloudOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">Authentication Required</h3>
          <p className="text-gray-400 mb-6">Please sign in to view your trips.</p>
          <Link to="/signin" className="bg-emerald-500 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-600 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (selectedTrip) {
      return (
          <ItineraryView 
            itinerary={selectedTrip} 
            preferences={selectedTrip.preferences}
            onClose={() => setSelectedTrip(null)} 
            onSave={handleUpdateTrip}
            onBook={handleBookTrip}
            isBooked={selectedTrip.isBooked}
            closeLabel="Back to Trips"
          />
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Trips</h1>
      
      {trips.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No trips planned yet</h3>
          <p className="text-gray-400 mb-6">Start your adventure by creating a new itinerary.</p>
          <Link to="/create-trip" className="bg-emerald-500 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-600 transition-colors">
            Plan a Trip
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div 
                key={trip.id} 
                className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border flex flex-col cursor-pointer group ${trip.isBooked ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'}`}
                onClick={() => setSelectedTrip(trip)}
            >
              <div className="h-48 bg-gray-200 relative">
                {/* Travel image from Unsplash */}
                <img 
                    src={getTravelImage(trip.tripName, 800, 600)} 
                    alt={trip.tripName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback to random travel image if specific search fails
                      e.currentTarget.src = getRandomTravelImage(800, 600);
                    }}
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-700">
                    {trip.dailyItinerary.length} Days
                </div>
                {trip.isBooked && (
                     <div className="absolute bottom-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                        <CheckCircle className="w-3 h-3" /> Booked
                     </div>
                )}
              </div>
              
              <div className="p-6 flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{trip.tripName}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{trip.destinationOverview}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Planned</span>
                    <span className="font-semibold text-emerald-600">{trip.currency} {trip.totalEstimatedCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                 <div className="flex gap-2">
                    <button 
                        onClick={(e) => handleEditRedirect(trip, e)} 
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                        title="Regenerate/Edit Preferences"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => handleDeleteTrip(trip.id, e)} 
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                 <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700">
                    View Details <ArrowRight className="w-4 h-4" />
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTrips;