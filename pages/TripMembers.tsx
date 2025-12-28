import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Crown, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { getTrip, calculatePaymentSplits, subscribeToTripExpenses } from '../firebase/tripService';
import { SavedTrip } from '../types';
import { getDocument } from '../firebase/dbService';

const TripMembersPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [paymentSplits, setPaymentSplits] = useState<Record<string, { owes: Record<string, number>; owedBy: Record<string, number>; totalOwed: number; totalOwing: number }>>({});
  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  // Fetch trip data and user names
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;
    const run = async () => {
      if (!tripId) return;
      try {
        setLoading(true);
        const tripData = await getTrip(tripId);
        setTrip(tripData);
        const allMembers = [tripData.userId, ...(tripData.joiners || [])];
        const uniqueMembers = [...new Set(allMembers.filter(id => id))];
        await fetchUserNames(uniqueMembers);
        const splits = await calculatePaymentSplits(tripId);
        if (active) setPaymentSplits(splits);
        unsubscribe = subscribeToTripExpenses(tripId, async () => {
          const updatedSplits = await calculatePaymentSplits(tripId);
          if (active) setPaymentSplits(updatedSplits);
        });
      } catch (err) {
        console.error('Error loading trip data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
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
        <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="font-semibold text-amber-800 mb-2">Simple Guide</div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-800">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
              Pay
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              Get
            </span>
            <span className="flex items-center gap-1">
              <ArrowRight className="w-4 h-4 text-red-600" />
              Pay to
            </span>
            <span className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4 text-green-600" />
              Get from
            </span>
          </div>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Who Pays Whom</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(paymentSplits).flatMap(([fromUser, data]) => 
              Object.entries(data.owes).map(([toUser, amount]) => (
                <div key={`${fromUser}-${toUser}`} className="flex items-center text-sm">
                  <ArrowRight className="w-4 h-4 mr-1 text-red-600" />
                  <span className="font-medium">{userNames[fromUser] || fromUser.substring(0, 8) + '...'}</span>
                  <span className="mx-2">pays</span>
                  <span className="font-medium">{userNames[toUser] || toUser.substring(0, 8) + '...'}</span>
                  <span className="ml-2 text-red-700">{formatCurrency(amount)}</span>
                </div>
              ))
            )}
            {Object.keys(paymentSplits).length === 0 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center text-sm text-gray-600">
                No payments needed
              </div>
            )}
          </div>
        </motion.div>
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
                      <div className="space-y-2 mt-3">
                        {paymentSplits[memberId]?.totalOwing > 0 ? (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="font-semibold text-red-700 mb-1">Needs to Pay</div>
                            <div className="text-lg font-bold text-red-600">
                              ₹{(paymentSplits[memberId].totalOwing || 0).toFixed(2)}
                            </div>
                            {Object.entries(paymentSplits[memberId].owes || {}).map(([toUser, amount]) => (
                              <div key={toUser} className="text-sm text-red-600 ml-1 mt-1">
                                <ArrowRight className="inline w-4 h-4 mr-1 text-red-600" />
                                Pay ₹{amount.toFixed(2)} to {userNames[toUser] || toUser.substring(0, 8) + '...'}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {paymentSplits[memberId]?.totalOwed > 0 ? (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="font-semibold text-green-700 mb-1">Will Get Back</div>
                            <div className="text-lg font-bold text-green-600">
                              ₹{(paymentSplits[memberId].totalOwed || 0).toFixed(2)}
                            </div>
                            {Object.entries(paymentSplits[memberId].owedBy || {}).map(([fromUser, amount]) => (
                              <div key={fromUser} className="text-sm text-green-600 ml-1 mt-1">
                                <ArrowLeft className="inline w-4 h-4 mr-1 text-green-600" />
                                From {userNames[fromUser] || fromUser.substring(0, 8) + '...'}: ₹{amount.toFixed(2)}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {!paymentSplits[memberId] || (paymentSplits[memberId].totalOwing === 0 && paymentSplits[memberId].totalOwed === 0) ? (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center text-sm text-gray-600">
                            All Set! No payments needed
                          </div>
                        ) : null}
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
