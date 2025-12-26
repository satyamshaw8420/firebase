import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, FileText, IndianRupee, Users } from 'lucide-react';
import { Expense } from '../types';
import { getTripExpenses, subscribeToTripExpenses } from '../firebase/tripService';
import { getDocument } from '../firebase/dbService';
import { motion } from 'framer-motion';
import TripCollaborationView from '../components/TripCollaborationView';
import TripItineraryView from '../components/TripItineraryView';
import TripMembersView from '../components/TripMembersView';
import { getTrip } from '../firebase/tripService';
import { SavedTrip } from '../types';


const TripCollaborationPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'expenses' | 'itinerary' | 'members'>('expenses');
  const [tripData, setTripData] = useState<SavedTrip | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  
  // State for members tab
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  
  // Set up real-time subscription to expenses
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const setupSubscription = async () => {
      try {
        // Set up real-time listener for expenses
        unsubscribe = subscribeToTripExpenses(tripId, (updatedExpenses) => {
          setExpenses(updatedExpenses);
        });
      } catch (err) {
        console.error('Error setting up expense subscription:', err);
      }
    };
    
    setupSubscription();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tripId]);
  
  // Fetch user names when trip data changes
  useEffect(() => {
    if (tripData) {
      const allMembers = [tripData.userId, ...(tripData.joiners || [])];
      const uniqueMembers = [...new Set(allMembers.filter(id => id))];
      fetchUserNames(uniqueMembers);
    }
  }, [tripData]);
  
  const fetchUserNames = async (userIds: string[]) => {
    const newNames: Record<string, string> = { ...userNames };
    
    for (const userId of userIds) {
      if (!newNames[userId]) { // Only fetch if we don't already have the name
        try {
          const userData: any = await getDocument('users', userId);
          if (userData) {
            newNames[userId] = userData.name || userData.displayName || userData.email || `User ${userId.substring(0, 8)}`;
          } else {
            newNames[userId] = `User ${userId.substring(0, 8)}`;
          }
        } catch (error) {
          console.error(`Error fetching user data for ${userId}:`, error);
          newNames[userId] = `User ${userId.substring(0, 8)}`;
        }
      }
    }
    
    // Update state to trigger re-render
    setUserNames(newNames);
  };

  if (!tripId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-lg">Trip ID is required</div>
          <button 
            onClick={() => navigate('/community')}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Go Back to Community
          </button>
        </div>
      </div>
    );
  }
  
  // Fetch trip data for itinerary view
  useEffect(() => {
    const fetchTripData = async () => {
      if (tripId) {
        try {
          setLoadingTrip(true);
          const trip = await getTrip(tripId);
          setTripData(trip);
        } catch (error) {
          console.error('Error fetching trip data:', error);
        } finally {
          setLoadingTrip(false);
        }
      }
    };
    
    fetchTripData();
  }, [tripId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/community')}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-6"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">{activeTab === 'itinerary' ? 'Trip Itinerary' : activeTab === 'members' ? 'Trip Members' : 'Trip Collaboration'}</h1>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-6xl mx-auto px-4 py-6"
      >
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium flex items-center ${
              activeTab === 'expenses'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('expenses')}
          >
            <IndianRupee className="w-4 h-4 mr-2" />
            Trip Expenses
          </button>
          <button
            className={`px-4 py-2 font-medium flex items-center ${
              activeTab === 'itinerary'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('itinerary')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Itinerary
          </button>
          <button
            className={`px-4 py-2 font-medium flex items-center ${
              activeTab === 'members'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('members')}
          >
            <Users className="w-4 h-4 mr-2" />
            Members
          </button>
        </div>

        {/* Content based on active tab */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'expenses' && (
            <TripCollaborationView tripId={tripId} />
          )}
          
          {activeTab === 'itinerary' && (
            tripData ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <TripItineraryView 
                  trip={tripData} 
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading itinerary...</p>
              </div>
            )
          )}
          
          {activeTab === 'members' && (
            <TripMembersView 
              trip={tripData} 
              expenses={expenses}
              userNames={userNames}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TripCollaborationPage;