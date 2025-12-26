import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, User, ChevronDown, ChevronUp } from 'lucide-react';
import { SavedTrip, Expense } from '../types';

interface TripMemberCardProps {
  memberId: string;
  trip: SavedTrip | null;
  expenses: Expense[];
  userNames: Record<string, string>;
  formatCurrency: (amount: number) => string;
}

const TripMemberCard: React.FC<TripMemberCardProps> = ({ 
  memberId, 
  trip, 
  expenses, 
  userNames,
  formatCurrency
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total expenses paid by this member
  const totalPaid = expenses
    .filter(expense => expense.paidBy === memberId)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate total amount this member owes
  const totalOwed = expenses
    .filter(expense => expense.splitBetween.includes(memberId))
    .reduce((sum, expense) => sum + (expense.amount / expense.splitBetween.length), 0);

  // Calculate net balance
  const netBalance = totalPaid - totalOwed;

  // Determine role
  const isCreator = memberId === trip?.userId;

  // Calculate who owes this member money
  const owesToMember = expenses
    .filter(expense => expense.splitBetween.includes(memberId) && expense.paidBy !== memberId)
    .map(expense => ({
      from: expense.paidBy,
      amount: expense.amount / expense.splitBetween.length
    }));

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-300">
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
            <h4 className="font-semibold text-gray-900">{userNames[memberId] || memberId.substring(0, 8) + '...'}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isCreator ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
              {isCreator ? 'Creator/Admin' : 'Member'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Money I Paid:</span>
          <span className="font-medium">{formatCurrency(totalPaid)}</span>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Money I'll Get:</span>
            <span className="font-medium">{formatCurrency(totalOwed)}</span>
          </div>
          {totalOwed > 0 && (
            <div className="mt-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center text-xs text-blue-500 hover:text-blue-700 w-full text-left"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" /> 
                    Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" /> 
                    from {owesToMember.length} members
                  </>
                )}
              </button>
              
              {isExpanded && owesToMember.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1 pl-2 border-l-2 border-gray-200"
                >
                  {owesToMember.map((owe, index) => (
                    <div key={index} className="text-xs">
                      <span className="text-gray-600">From {userNames[owe.from] || owe.from.substring(0, 8)}:</span>{' '}
                      <span className="font-medium">{formatCurrency(owe.amount)}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between text-sm font-semibold">
            <span>My Final Amount:</span>
            <span className={netBalance > 0 ? 'text-green-600' : netBalance < 0 ? 'text-red-600' : 'text-gray-600'}>
              {netBalance > 0 ? '₹' : 'You Owe ₹'}{Math.abs(netBalance).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripMemberCard;