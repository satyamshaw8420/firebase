import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { SavedTrip, Expense } from '../types';
import TripMemberCard from './TripMemberCard';

interface TripMembersViewProps {
  trip: SavedTrip | null;
  expenses: Expense[];
  userNames: Record<string, string>;
}

const TripMembersView: React.FC<TripMembersViewProps> = ({ 
  trip, 
  expenses, 
  userNames 
}) => {
  const getAllMembers = (): string[] => {
    if (!trip) return [];
    // Combine creator and joiners, but remove duplicates
    const allMembers = [trip.userId, ...(trip.joiners || [])];
    return [...new Set(allMembers.filter(id => id))];
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 p-6"
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
          {getAllMembers().length} members
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trip && (
          getAllMembers().map((memberId) => (
            <TripMemberCard 
              key={memberId} 
              memberId={memberId}
              trip={trip}
              expenses={expenses}
              userNames={userNames}
              formatCurrency={formatCurrency}
            />
          ))
        )}
      </div>
    </motion.div>
  );
};

export default TripMembersView;