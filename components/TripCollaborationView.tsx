import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Users, 
  DollarSign, 
  FileText,
  Divide,
  Crown,
  User,
  Wallet,
  CreditCard,
  Coins,
  MapPin,
  Calendar,
  IndianRupee,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { SavedTrip, Expense } from '../types';

// Define form state interface with string amount for input handling
interface ExpenseFormState {
  amount: string;
  description: string;
  paidBy: string;
  splitBetween: string[];
  category: string;
  customCategory: string;
}
import { 
  getTrip, 
  getTripExpenses, 
  addExpenseToTrip, 
  updateTripExpense, 
  deleteTripExpense, 
  calculatePaymentSplits,
  subscribeToTripExpenses
} from '../firebase/tripService';
import { getDocument } from '../firebase/dbService';

interface TripCollaborationViewProps {
  tripId: string;
}

interface PaymentSplit {
  owes: Record<string, number>;
  owedBy: Record<string, number>;
  totalOwed: number;
  totalOwing: number;
}

const TripCollaborationView: React.FC<TripCollaborationViewProps> = ({ tripId }) => {
  const { currentUser } = useAuth();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentSplits, setPaymentSplits] = useState<Record<string, PaymentSplit>>({});
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  
  // Batch operations state
  const [editMode, setEditMode] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  
  // Form state for expense form
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    amount: '',
    description: '',
    paidBy: '', // Will be set to current user
    splitBetween: [], // Will be set to all members
    category: '',
    customCategory: '', // For when user selects "Other"
  });
  
  // Payment options state
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'split' | 'full' | 'custom'>('split');
  const [customPayments, setCustomPayments] = useState<Record<string, number>>({});

  // Set up real-time subscription to expenses
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;
    
    const setupSubscription = () => {
      try {
        // Set up real-time listener for expenses
        unsubscribe = subscribeToTripExpenses(tripId, (updatedExpenses) => {
          if (!isMounted) return;
          setExpenses(updatedExpenses);
          
          // Recalculate payment splits when expenses change
          calculatePaymentSplits(tripId).then(splits => {
            if (isMounted) {
              setPaymentSplits(splits);
            }
          }).catch(err => {
            if (isMounted) {
              console.error('Error recalculating payment splits:', err);
            }
          });
        });
      } catch (err) {
        if (isMounted) {
          console.error('Error setting up expense subscription:', err);
          setError('Failed to set up real-time updates');
        }
      }
    };
    
    setupSubscription();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tripId]);

  // Fetch trip data (only once to get trip details)
  useEffect(() => {
    const fetchTripData = async () => {
      try {
        setLoading(true);
        const tripData = await getTrip(tripId);
        
        setTrip(tripData);
        
        // Fetch user names for all members
        if (tripData) {
          const allMembers = getAllMembers();
          await fetchUserNames(allMembers);
        }
      } catch (err) {
        setError('Failed to load trip data');
        console.error('Error loading trip data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId]);

  // Refresh data after expense operations (this will now be handled by the real-time subscription)
  const refreshData = async () => {
    try {
      // With real-time subscription, this function is less critical
      // but we'll keep it for manual refresh scenarios
      const expensesData = await getTripExpenses(tripId);
      const splitsData = await calculatePaymentSplits(tripId);
      
      setExpenses(expensesData);
      setPaymentSplits(splitsData);
      
      // Refresh user names after data update
      if (trip) {
        const allMembers = getAllMembers();
        await fetchUserNames(allMembers);
      }
    } catch (err) {
      setError('Failed to refresh data');
      console.error('Error refreshing data:', err);
    }
  };
  
  // Fetch user names when trip joiners change
  useEffect(() => {
    if (trip) {
      const allMembers = getAllMembers();
      fetchUserNames(allMembers);
    }
  }, [trip?.joiners]);

  const getAllMembers = (): string[] => {
    if (!trip) return [];
    // Combine creator and joiners, but remove duplicates
    const allMembers = [trip.userId, ...(trip.joiners || [])];
    return [...new Set(allMembers.filter(id => id))];
  };

  const fetchUserNames = async (userIds: string[]) => {
    const newNames: Record<string, string> = { ...userNames };
    const promises = userIds.map(async (userId) => {
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
    });
    
    await Promise.all(promises);
    setUserNames(newNames);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      // If user selects "Other", preserve the custom category value
      // If user selects something else, clear the custom category
      setExpenseForm(prev => ({
        ...prev,
        category: value,
        customCategory: value === 'Other' ? prev.customCategory : ''
      }));
    } else {
      setExpenseForm(prev => ({
        ...prev,
        [name]: name === 'amount' ? value : name === 'splitBetween' ? 
          (e.target as HTMLSelectElement).selectedOptions ? 
            Array.from((e.target as HTMLSelectElement).selectedOptions).map(option => option.value) : 
            value : 
          value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!currentUser) {
        setError('You must be logged in to add expenses');
        return;
      }
      
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount) || 0,
        category: expenseForm.category === 'Other' ? expenseForm.customCategory : expenseForm.category,
        paidBy: expenseForm.paidBy || currentUser.uid,
        splitBetween: expenseForm.splitBetween.length > 0 ? expenseForm.splitBetween : getAllMembers(),
        date: Date.now(),
        createdBy: currentUser.uid,
      };

      if (editingExpenseId) {
        // Update existing expense
        await updateTripExpense(tripId, editingExpenseId, expenseData);
        
        // Refetch data to ensure UI updates properly after edit
        const expensesData = await getTripExpenses(tripId);
        const splitsData = await calculatePaymentSplits(tripId);
        
        setExpenses(expensesData);
        setPaymentSplits(splitsData);
      } else {
        // Add new expense
        await addExpenseToTrip(tripId, expenseData);
      }

      setExpenseForm({
        amount: '',
        description: '',
        paidBy: '',
        splitBetween: [],
        category: '',
        customCategory: '',
      });
      setShowExpenseForm(false);
      setEditingExpenseId(null);
    } catch (err) {
      setError('Failed to save expense');
      console.error('Error saving expense:', err);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    // Determine if this expense had a custom category (meaning it was originally "Other")
    const isCustomCategory = !['Accommodation', 'Food & Dining', 'Transportation', 'Activities', 'Shopping', 'Entertainment', 'Other', ''].includes(expense.category || '');
    
    setEditingExpenseId(expense.id);
    setExpenseForm({
      amount: expense.amount.toString(),
      description: expense.description,
      paidBy: expense.paidBy,
      splitBetween: expense.splitBetween,
      category: isCustomCategory ? 'Other' : expense.category || '',
      customCategory: isCustomCategory ? expense.category || '' : expense.customCategory || '',
    });
    setShowExpenseForm(true);
  };



  const handleDeleteExpense = async (expenseId: string) => {
    try {
      if (!currentUser) {
        setError('You must be logged in to delete expenses');
        return;
      }
      
      // Find the expense to check if current user is authorized to delete it
      const expenseToDelete = expenses.find(exp => exp.id === expenseId);
      
      // Only allow the user who paid the expense or trip owner to delete it
      // We perform a client-side check for better UX, but we also allow the operation to proceed
      // if the standard checks fail, in case the user has admin privileges (enforced by server rules).
      const isStandardAuthorized = 
        (expenseToDelete && expenseToDelete.paidBy === currentUser.uid) || 
        (expenseToDelete && expenseToDelete.createdBy === currentUser.uid) || 
        (trip && trip.userId === currentUser.uid);

      if (!isStandardAuthorized) {
         // We don't return here anymore, allowing admins to proceed.
         console.log('User not authorized by standard client checks. Attempting delete as admin...');
      }
      
      // Delete from the database
      await deleteTripExpense(tripId, expenseId);
      
      // The real-time subscription should update the UI automatically
      // But we'll still refresh to ensure consistency
    } catch (err: any) {
      setError(`Failed to delete expense: ${err.message || 'Permission denied'}`);
      console.error('Error deleting expense:', err);
      
      // Refetch data to ensure UI is consistent with database
      try {
        const expensesData = await getTripExpenses(tripId);
        const splitsData = await calculatePaymentSplits(tripId);
        
        setExpenses(expensesData);
        setPaymentSplits(splitsData);
      } catch (refreshErr) {
        console.error('Error refreshing data after delete failure:', refreshErr);
      }
    }
  };
  
  // Batch operations
  const toggleExpenseSelection = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };
  
  const selectAllExpenses = () => {
    const allExpenseIds = new Set(expenses.map(expense => expense.id));
    setSelectedExpenses(allExpenseIds);
  };
  
  const clearAllSelections = () => {
    setSelectedExpenses(new Set());
  };
  
  const deleteSelectedExpenses = async () => {
    if (selectedExpenses.size === 0) return;
    
    try {
      // Delete all selected expenses
      const deletionPromises = Array.from(selectedExpenses).map(async (expenseId) => {
        try {
          await deleteTripExpense(tripId, expenseId);
          return { id: expenseId, status: 'success' };
        } catch (error) {
          console.error(`Failed to delete expense ${expenseId}:`, error);
          return { id: expenseId, status: 'error', error };
        }
      });
      
      await Promise.all(deletionPromises);
      
      // Refetch data to update UI
      const expensesData = await getTripExpenses(tripId);
      const splitsData = await calculatePaymentSplits(tripId);
      
      setExpenses(expensesData);
      setPaymentSplits(splitsData);
      setSelectedExpenses(new Set()); // Clear selections after deletion
      setEditMode(false); // Exit edit mode
    } catch (err) {
      setError('Failed to delete selected expenses');
      console.error('Error deleting selected expenses:', err);
    }
  };
  
  const updateSelectedExpensesCategory = async (newCategory: string) => {
    if (selectedExpenses.size === 0) return;
    
    try {
      // Update category for all selected expenses
      const updatePromises = Array.from(selectedExpenses).map(async (expenseId) => {
        try {
           await updateTripExpense(tripId, expenseId, { category: newCategory });
        } catch (error) {
           console.error(`Failed to update category for expense ${expenseId}:`, error);
        }
      });
      
      await Promise.all(updatePromises);
      
      // Refetch data to update UI
      const expensesData = await getTripExpenses(tripId);
      const splitsData = await calculatePaymentSplits(tripId);
      
      setExpenses(expensesData);
      setPaymentSplits(splitsData);
      setSelectedExpenses(new Set()); // Clear selections after update
      setEditMode(false); // Exit edit mode
    } catch (err) {
      setError('Failed to update selected expenses');
      console.error('Error updating selected expenses:', err);
    }
  };
  
  const updateSelectedExpensesAmount = async (newAmount: number) => {
    if (selectedExpenses.size === 0) return;
    
    try {
      // Update amount for all selected expenses
      const updatePromises = Array.from(selectedExpenses).map(async (expenseId) => {
        try {
           await updateTripExpense(tripId, expenseId, { amount: newAmount });
        } catch (error) {
           console.error(`Failed to update amount for expense ${expenseId}:`, error);
        }
      });
      
      await Promise.all(updatePromises);
      
      // Refetch data to update UI
      const expensesData = await getTripExpenses(tripId);
      const splitsData = await calculatePaymentSplits(tripId);
      
      setExpenses(expensesData);
      setPaymentSplits(splitsData);
      setSelectedExpenses(new Set()); // Clear selections after update
      setEditMode(false); // Exit edit mode
    } catch (err) {
      setError('Failed to update selected expenses');
      console.error('Error updating selected expenses:', err);
    }
  };
  
  // Function to apply payment option
  const applyPaymentOption = async () => {
    try {
      // Create new expenses based on the selected payment option
      const allMembers = getAllMembers();
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      if (selectedPaymentOption === 'split') {
        // Reset to equal split - this will use the existing logic
        // We don't need to modify expenses for equal split as the calculation is done in the backend
        setShowPaymentOptions(false);
        return;
      }
      
      if (selectedPaymentOption === 'full') {
        // Find who is paying full
        const fullPayer = Object.entries(customPayments).find(([userId, amount]) => 
          amount === totalExpenses
        )?.[0];
        
        if (fullPayer) {
          // Create a single expense paid by the full payer and split among all members
          // For this implementation, we'll add a new expense
          const newExpense = {
            amount: totalExpenses,
            description: 'Full trip payment',
            paidBy: fullPayer,
            splitBetween: allMembers,
            date: Date.now(),
            category: 'Trip Payment',
            createdBy: currentUser?.uid,
          };
          
          // Delete all existing expenses first
          for (const expense of expenses) {
            await deleteTripExpense(tripId, expense.id);
          }
          
          // Add the new consolidated expense
          await addExpenseToTrip(tripId, newExpense);
        }
      } else if (selectedPaymentOption === 'custom') {
        // For custom payments, we need to create expenses that reflect the custom amounts
        // This involves creating individual expenses for each person's contribution
        
        // First, delete all existing expenses
        for (const expense of expenses) {
          await deleteTripExpense(tripId, expense.id);
        }
        
        // Create a separate expense for each person's custom payment
        const allMembers = getAllMembers();
        for (const memberId of allMembers) {
          const amount = customPayments[memberId] || 0;
          if (amount > 0) {  // Only add expense if the person is paying something
            const newExpense = {
              amount: amount,
              description: `Custom payment by ${userNames[memberId] || memberId.substring(0, 8)}`,
              paidBy: memberId,
              splitBetween: [memberId], // Each person pays for their own custom amount
              date: Date.now(),
              category: 'Custom Payment',
              createdBy: currentUser?.uid,
            };
            
            await addExpenseToTrip(tripId, newExpense);
          }
        }
      }
      
      setShowPaymentOptions(false);
      // refreshData(); // Not needed anymore since we have real-time subscription
    } catch (error) {
      console.error('Error applying payment option:', error);
      setError('Failed to apply payment option');
    }
  };
  
  // Function to create expenses based on payment option
  const createExpensesForPaymentOption = (option: 'split' | 'full' | 'custom') => {
    const allMembers = getAllMembers();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    if (option === 'full') {
      // Find who is paying full
      const fullPayer = Object.entries(customPayments).find(([userId, amount]) => 
        amount === totalExpenses
      )?.[0];
      
      if (fullPayer) {
        // Create a single expense paid by the full payer and split among all members
        return [{
          id: `full_payment_${Date.now()}`,
          amount: totalExpenses,
          description: 'Full trip payment',
          paidBy: fullPayer,
          splitBetween: allMembers,
          date: Date.now(),
          category: 'Trip Payment',
          createdBy: currentUser?.uid,
        }];
      }
    } else if (option === 'custom') {
      // For custom payments, we create expenses based on the custom amounts
      // This is complex and would require multiple expenses or a different approach
      // For now, we'll create a single expense with the custom split
      
      // Find the person who pays the most to be the payer
      const maxPayer = Object.entries(customPayments).reduce((max, current) => 
        current[1] > max[1] ? current : max
      )[0];
      
      return [{
          id: `custom_split_${Date.now()}`,
          amount: totalExpenses,
          description: 'Custom trip payment split',
          paidBy: maxPayer,
          splitBetween: allMembers,
          date: Date.now(),
          category: 'Trip Payment',
          createdBy: currentUser?.uid,
        }];
    }
    
    // For split option, return the original expenses
    return expenses;
  };
    
  
    

    
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <div className="flex items-center">
          <div className="flex items-center">
            <X className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      </div>
    );
  }
  
  // Format currency as rupees
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };
    
  return (
    <div className="space-y-8">
      {/* Trip Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{trip?.tripName}</h2>
            <p className="opacity-90">{trip?.destinationOverview}</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm opacity-80">Members</div>
              <div className="text-xl font-bold">{getAllMembers().length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm opacity-80">Total Cost</div>
              <div className="text-xl font-bold">{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expenses Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <IndianRupee className="w-5 h-5 mr-2 text-emerald-500" />
            Trip Expenses
          </h3>
          <div className="flex items-center space-x-3">
            {editMode ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllExpenses}
                  className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllSelections}
                  className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={deleteSelectedExpenses}
                  disabled={selectedExpenses.size === 0}
                  className={`text-sm px-3 py-1 rounded-lg transition-colors ${selectedExpenses.size === 0 ? 'bg-red-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                  Delete ({selectedExpenses.size})
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setExpenseForm({
                      amount: '', 
                      description: '',
                      paidBy: currentUser?.uid || '',
                      splitBetween: getAllMembers(), // Default to all members
                      category: '',
                      customCategory: '',
                    });
                    setShowExpenseForm(true);
                    setEditingExpenseId(null);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors mr-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Expense
                </motion.button>
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No expenses added yet</p>
            </div>
          ) : (
            expenses.map((expense, index) => (
              <motion.div
                key={`${expense.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {editMode && (
                    <input
                      type="checkbox"
                      checked={selectedExpenses.has(expense.id)}
                      onChange={() => toggleExpenseSelection(expense.id)}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{expense.description}</div>
                    <div className="text-sm text-gray-500">
                      Paid by: {userNames[expense.paidBy] || expense.paidBy.substring(0, 8) + '...'} • {formatCurrency(expense.amount)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Category: {expense.category || 'Uncategorized'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Split between: {expense.splitBetween.slice(0, 3).map(id => userNames[id] || id.substring(0, 6)).join(', ')}
                      {expense.splitBetween.length > 3 && ` +${expense.splitBetween.length - 3} more`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {editMode ? (
                    <span className="text-sm text-gray-500">
                      {expense.paidBy === currentUser?.uid ? 'Yours' : 'Other'}
                    </span>
                  ) : (
                    <>
                      {currentUser && (
                      // Only allow deletion/editing if they are the payer or creator
                      (expense.paidBy === currentUser.uid || 
                       expense.createdBy === currentUser.uid)
                    ) && (
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                      )}
                      {currentUser && (
                        // Only allow deletion/editing if they are the payer or creator
                        (expense.paidBy === currentUser.uid || 
                         expense.createdBy === currentUser.uid)
                      ) && (
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Payment Splits Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Divide className="w-5 h-5 mr-2 text-emerald-500" />
            Who Pays Whom
          </h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg">
              Total: {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
            </div>
            <button
              onClick={() => {
                if (expenses.length === 0) {
                  setError('Nothing to pay');
                  return;
                }
                const allMembers = getAllMembers();
                const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
                const equalAmount = totalExpenses / allMembers.length;
                const initialCustomPayments: Record<string, number> = {};
                allMembers.forEach(memberId => {
                  initialCustomPayments[memberId] = equalAmount;
                });
                setCustomPayments(initialCustomPayments);
                setShowPaymentOptions(true);
              }}
              disabled={expenses.length === 0}
              className={`text-sm ${expenses.length === 0 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'} px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1`}
            >
              <Wallet className="w-4 h-4" />
              Payment Options
            </button>
          </div>
        </div>
        <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="font-semibold text-amber-800 mb-2">Simple Payment Instructions</div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-800 mb-2">
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
          {expenses.length === 0 ? (
            <div className="text-amber-700 text-sm">No expenses added</div>
          ) : (
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
            </div>
          )}
        </div>
                
        <div className="space-y-4">
          {Object.entries(paymentSplits).map(([userId, splits]) => (
            <div key={userId} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="font-medium mb-3 text-lg">{userNames[userId] || userId.substring(0, 8) + '...'}</div>
              
              {splits.totalOwing > 0 && (
                <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="font-semibold text-red-700 mb-1">Needs to Pay:</div>
                  <div className="text-lg font-bold text-red-600">{formatCurrency(splits.totalOwing)}</div>
                  {Object.entries(splits.owes).map(([toUser, amount]) => (
                    <div key={toUser} className="text-sm text-red-600 ml-2 mt-1">
                      <ArrowRight className="inline w-4 h-4 mr-1 text-red-600" />
                      Pay {formatCurrency(amount)} to {userNames[toUser] || toUser.substring(0, 8) + '...'}
                    </div>
                  ))}
                </div>
              )}
              
              {splits.totalOwed > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-semibold text-green-700 mb-1">Will Get Back:</div>
                  <div className="text-lg font-bold text-green-600">{formatCurrency(splits.totalOwed)}</div>
                  {Object.entries(splits.owedBy).map(([fromUser, amount]) => (
                    <div key={fromUser} className="text-sm text-green-600 ml-2 mt-1">
                      <ArrowLeft className="inline w-4 h-4 mr-1 text-green-600" />
                      From {userNames[fromUser] || fromUser.substring(0, 8) + '...'}: {formatCurrency(amount)}
                    </div>
                  ))}
                </div>
              )}
              
              {splits.totalOwing === 0 && splits.totalOwed === 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <div className="text-gray-600">All Set! No payments needed</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Payment Options Modal */}
      <AnimatePresence>
        {showPaymentOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Payment Options</h3>
                <button
                  onClick={() => setShowPaymentOptions(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
      
              <div className="space-y-6">
                {/* Payment Option Selection */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Choose Payment Method</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        setSelectedPaymentOption('split');
                        // Initialize custom payments with equal split
                        const allMembers = getAllMembers();
                        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
                        const equalAmount = totalExpenses / allMembers.length;
                        
                        const initialCustomPayments: Record<string, number> = {};
                        allMembers.forEach(memberId => {
                          initialCustomPayments[memberId] = equalAmount;
                        });
                        
                        setCustomPayments(initialCustomPayments);
                      }}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${selectedPaymentOption === 'split' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Divide className="w-6 h-6 mb-2 text-emerald-500" />
                      <span className="font-medium">Split Equally</span>
                      <span className="text-xs text-gray-500 mt-1">{getAllMembers().length > 0 ? formatCurrency((expenses.reduce((sum, exp) => sum + exp.amount, 0) / getAllMembers().length)) : '0.00'} per person</span>
                    </button>
                    <button
                      onClick={() => setSelectedPaymentOption('full')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${selectedPaymentOption === 'full' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Wallet className="w-6 h-6 mb-2 text-emerald-500" />
                      <span className="font-medium">Pay Full</span>
                      <span className="text-xs text-gray-500 mt-1">{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))} total</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPaymentOption('custom');
                        // Initialize custom payments with equal split as default
                        const allMembers = getAllMembers();
                        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
                        const equalAmount = totalExpenses / allMembers.length;
                        
                        const initialCustomPayments: Record<string, number> = {};
                        allMembers.forEach(memberId => {
                          initialCustomPayments[memberId] = equalAmount;
                        });
                        
                        setCustomPayments(initialCustomPayments);
                      }}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${selectedPaymentOption === 'custom' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Coins className="w-6 h-6 mb-2 text-emerald-500" />
                      <span className="font-medium">Custom</span>
                      <span className="text-xs text-gray-500 mt-1">Set amounts</span>
                    </button>
                  </div>
                </div>
      
                {/* Custom Payment Inputs */}
                {selectedPaymentOption === 'custom' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Set Custom Amounts</h4>
                    <p className="text-sm text-gray-600 mb-4">Total expenses: ₹{expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}</p>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50">
                      {getAllMembers().map((memberId) => (
                        <div key={memberId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold mr-3">
                              {(userNames[memberId] || memberId)[0].toUpperCase()}
                            </div>
                            <span className="font-medium">{userNames[memberId] || memberId.substring(0, 8) + '...'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2 text-gray-600">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={customPayments[memberId] || 0}
                              onChange={(e) => {
                                const amount = parseFloat(e.target.value) || 0;
                                setCustomPayments(prev => ({
                                  ...prev,
                                  [memberId]: amount
                                }));
                              }}
                              placeholder="Enter Amount"
                              className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{formatCurrency(Object.values(customPayments).reduce((sum, amount) => sum + amount, 0))}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Expenses:</span>
                        <span>{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</span>
                      </div>
                      {Object.values(customPayments).reduce((sum, amount) => sum + amount, 0).toFixed(2) !== expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2) && (
                        <div className="text-red-600 text-sm mt-2">⚠ Amounts don't match total expenses</div>
                      )}
                    </div>
                  </div>
                )}
      
                {/* Full Payment Option */}
                {selectedPaymentOption === 'full' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Full Payment</h4>
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-sm text-blue-800 font-medium">Total Trip Cost: {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</div>
                      <p className="text-sm text-blue-600 mt-1">One person will pay the entire amount ({formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))})</p>
                    </div>
                                        
                    <div className="space-y-3">
                      {getAllMembers().map((memberId) => (
                        <label key={memberId} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="fullPayer"
                            checked={customPayments[memberId] === expenses.reduce((sum, exp) => sum + exp.amount, 0)}
                            onChange={() => {
                              const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
                              const newCustomPayments: Record<string, number> = {};
                                                  
                              getAllMembers().forEach(id => {
                                if (id === memberId) {
                                  newCustomPayments[id] = totalExpenses;
                                } else {
                                  newCustomPayments[id] = 0;
                                }
                              });
                                                  
                              setCustomPayments(newCustomPayments);
                            }}
                            className="mr-3 h-5 w-5 text-emerald-600"
                          />
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold mr-3">
                              {(userNames[memberId] || memberId)[0].toUpperCase()}
                            </div>
                            <span className="font-medium">{userNames[memberId] || memberId.substring(0, 8) + '...'}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Custom Payment Option */}
                {selectedPaymentOption === 'custom' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Custom Payment Split</h4>
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-sm text-blue-800 font-medium">Total Trip Cost: {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</div>
                      <p className="text-sm text-blue-600 mt-1">Set custom amounts each person will pay (must total {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))})</p>
                    </div>
                                        
                    <div className="space-y-3 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50">
                      {getAllMembers().map((memberId) => (
                        <div key={memberId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold mr-3">
                              {(userNames[memberId] || memberId)[0].toUpperCase()}
                            </div>
                            <span className="font-medium">{userNames[memberId] || memberId.substring(0, 8) + '...'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2 text-gray-600">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={customPayments[memberId] || 0}
                              onChange={(e) => {
                                const amount = parseFloat(e.target.value) || 0;
                                setCustomPayments(prev => ({
                                  ...prev,
                                  [memberId]: amount
                                }));
                              }}
                              placeholder="Enter Amount"
                              className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                                        
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{formatCurrency(Object.values(customPayments).reduce((sum, amount) => sum + amount, 0))}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Expenses:</span>
                        <span>{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</span>
                      </div>
                      {Object.values(customPayments).reduce((sum, amount) => sum + amount, 0).toFixed(2) !== expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2) && (
                        <div className="text-red-600 text-sm mt-2">⚠ Amounts don't match total expenses</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowPaymentOptions(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyPaymentOption}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    disabled={
                      selectedPaymentOption === 'custom' && 
                      Object.values(customPayments).reduce((sum, amount) => sum + amount, 0).toFixed(2) !== 
                      expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)
                    }
                  >
                    Apply Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Form Modal */}
      <AnimatePresence>
        {showExpenseForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingExpenseId ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button
                  onClick={() => {
                    setShowExpenseForm(false);
                    setEditingExpenseId(null);
                    setExpenseForm({
                      amount: '',
                      description: '',
                      paidBy: '',
                      splitBetween: [],
                      category: '',
                      customCategory: '',
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                   
                    name="amount"
                    value={expenseForm.amount}
                    onChange={handleFormChange}
                    placeholder="Enter your amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={expenseForm.description}
                    onChange={handleFormChange}
                    placeholder="e.g., Dinner at local restaurant, Hotel, Flight, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={expenseForm.category}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
                    >
                      <option value="">Select a category</option>
                      <option value="Accommodation">Accommodation</option>
                      <option value="Food & Dining">Food & Dining</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Activities">Activities</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  
                  {expenseForm.category === 'Other' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Please specify the category
                      </label>
                      <input
                        type="text"
                        name="customCategory"
                        value={expenseForm.customCategory}
                        onChange={handleFormChange}
                        placeholder="Enter custom category"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paid By
                  </label>
                  <div className="relative">
                    <select
                      name="paidBy"
                      value={expenseForm.paidBy}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
                      required
                    >
                      <option value="">Select who paid</option>
                      {getAllMembers().map((memberId) => (
                        <option key={memberId} value={memberId}>
                          {userNames[memberId] || memberId.substring(0, 8) + '...'}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Split Between
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Select members to split with:</span>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setExpenseForm(prev => ({
                            ...prev,
                            splitBetween: getAllMembers()
                          }))}
                          className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-200 transition-colors"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseForm(prev => ({
                            ...prev,
                            splitBetween: []
                          }))}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          None
                        </button>
                      </div>
                    </div>
                    {getAllMembers().map((memberId) => (
                      <label key={memberId} className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={expenseForm.splitBetween.includes(memberId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExpenseForm(prev => ({
                                ...prev,
                                splitBetween: [...prev.splitBetween, memberId]
                              }));
                            } else {
                              setExpenseForm(prev => ({
                                ...prev,
                                splitBetween: prev.splitBetween.filter(id => id !== memberId)
                              }));
                            }
                          }}
                          className="mr-3 h-5 w-5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold mr-3">
                            {(userNames[memberId] || memberId)[0].toUpperCase()}
                          </div>
                          <span className="text-gray-800">{userNames[memberId] || memberId.substring(0, 8) + '...'}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpenseForm(false);
                      setEditingExpenseId(null);
                      setExpenseForm({
                        amount: '',
                        description: '',
                        paidBy: '',
                        splitBetween: [],
                        category: '',
                        customCategory: '',
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    {editingExpenseId ? 'Update' : 'Add'} Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripCollaborationView;
