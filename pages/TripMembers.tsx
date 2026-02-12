import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Crown, User, ArrowLeft } from 'lucide-react';
import { getTrip } from '../firebase/tripService';
import { SavedTrip } from '../types';
import { getDocument } from '../firebase/dbService';

const TripMembersPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Fetch trip data and user names
  useEffect(() => {
    const fetchTripData = async () => {
      if (tripId) {
        try {
          setLoading(true);
          const tripData = await getTrip(tripId);
          setTrip(tripData);
          
          // Fetch user names for all members
          const allMembers = [tripData.userId, ...(tripData.joiners || [])];
          const uniqueMembers = [...new Set(allMembers.filter(id => id))];
          await fetchUserNames(uniqueMembers);
        } catch (err) {
          console.error('Error loading trip data:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTripData();
  }, [tripId]);

  const getAllMembers = (): string[] => {
    if (!trip) return [];
    // Combine creator and joiners, but remove duplicates
    const allMembers = [trip.userId, ...(trip.joiners || [])];
    return [...new Set(allMembers.filter(id => id))];
  };



  const fetchUserNames = async (userIds: string[]) => {
    const newNames: Record<string, string> = { ...userNames };
    
    // Process each user ID to fetch name
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

  // Calculate expenses for each member (similar to the TripCollaborationView component)
  // For now, we'll just show member information without expense details
  // If needed, we could fetch expenses and calculate financial summaries

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg">Trip not found</div>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if all member names are loaded
  const allMembers = trip ? [trip.userId, ...(trip.joiners || [])] : [];
  const uniqueMembers = [...new Set(allMembers.filter(id => id))];
  const allNamesLoaded = uniqueMembers.length === 0 || uniqueMembers.every(memberId => userNames[memberId]);

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
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-6"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">Trip Members</h1>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-6xl mx-auto px-4 py-6"
      >
        {/* Members Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="w-6 h-6 mr-3 text-emerald-500" />
                Trip Members
              </h3>
              <p className="text-gray-600 text-sm mt-1">Collaborate with your travel companions</p>
            </div>
            <div className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              {uniqueMembers.length} members
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trip && allNamesLoaded && (
              uniqueMembers.map((memberId) => {
                // Determine role
                const isCreator = memberId === trip.userId;
                
                return (
                  <div 
                    key={memberId} 
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {isCreator ? (
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                            <Crown className="w-5 h-5 text-amber-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{userNames[memberId]}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isCreator ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {isCreator ? 'Creator/Admin' : 'Member'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium">{isCreator ? 'Creator/Admin' : 'Member'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {trip && !allNamesLoaded && (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading member details...</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TripMembersPage;
