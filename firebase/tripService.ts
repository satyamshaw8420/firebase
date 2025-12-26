import { addDocument, getDocument, getAllDocuments, updateDocument, deleteDocument, queryDocuments, subscribeToCollection } from './dbService';
import { SavedTrip, Expense } from '../types';

// Collection name for trips
const TRIPS_COLLECTION = 'trips';

// Add a new trip
export const addTrip = async (trip: Omit<SavedTrip, 'id'>, creatorId: string) => {
  try {
    const tripWithCreator = {
      ...trip,
      userId: creatorId, // Store the creator's ID
    };
    const tripId = await addDocument(TRIPS_COLLECTION, tripWithCreator);
    return tripId;
  } catch (error) {
    console.error('Error adding trip:', error);
    throw error;
  }
};

// Join a trip
export const joinTrip = async (tripId: string, userId: string) => {
  try {
    // Get the current trip
    const trip = await getDocument(TRIPS_COLLECTION, tripId) as SavedTrip | null;
    if (!trip) {
      throw new Error('Trip not found');
    }
    
    // Initialize joiners array if it doesn't exist
    const joiners = trip.joiners || [];
    
    // Check if user is already joined
    if (joiners.includes(userId)) {
      throw new Error('User already joined this trip');
    }
    
    // Add user to joiners
    joiners.push(userId);
    
    // Update the trip
    await updateDocument(TRIPS_COLLECTION, tripId, { joiners });
    
    return tripId;
  } catch (error) {
    console.error('Error joining trip:', error);
    throw error;
  }
};

// Get a trip by ID
export const getTrip = async (tripId: string): Promise<SavedTrip | null> => {
  try {
    const trip = await getDocument(TRIPS_COLLECTION, tripId) as SavedTrip | null;
    return trip;
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
};

// Get all trips for a user
export const getUserTrips = async (userId: string): Promise<SavedTrip[]> => {
  try {
    const trips = await queryDocuments(
      TRIPS_COLLECTION,
      [{ field: 'userId', operator: '==', value: userId }]
    ) as SavedTrip[];
    return trips;
  } catch (error) {
    console.error('Error getting user trips:', error);
    throw error;
  }
};

// Update a trip
export const updateTrip = async (tripId: string, tripData: Partial<SavedTrip>) => {
  try {
    const updatedTripId = await updateDocument(TRIPS_COLLECTION, tripId, tripData);
    return updatedTripId;
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

// Delete a trip
export const deleteTrip = async (tripId: string) => {
  try {
    await deleteDocument(TRIPS_COLLECTION, tripId);
    return tripId;
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

// Get all trips (admin only)
export const getAllTrips = async (): Promise<SavedTrip[]> => {
  try {
    const trips = await getAllDocuments(TRIPS_COLLECTION) as SavedTrip[];
    return trips;
  } catch (error) {
    console.error('Error getting all trips:', error);
    throw error;
  }
};

// Get discoverable trips for community members
export const getDiscoverableTrips = async (communityMemberIds: string[], currentUserId: string) => {
  try {
    // Query trips that belong to community members and trips that the current user has joined
    const trips = [];
    
    // Get trips created by community members
    for (const userId of communityMemberIds) {
      try {
        const userTrips = await queryDocuments(
          TRIPS_COLLECTION,
          [{ field: 'userId', operator: '==', value: userId }]
        );
        trips.push(...userTrips);
      } catch (error) {
        // Skip users whose trips we can't access
        console.warn(`Could not fetch trips for user ${userId}:`, error);
      }
    }
    
    // Also get trips that the current user has joined
    try {
      const joinedTrips = await queryDocuments(
        TRIPS_COLLECTION,
        [{ field: 'joiners', operator: 'array-contains', value: currentUserId }]
      );
      trips.push(...joinedTrips);
    } catch (error) {
      console.warn('Could not fetch joined trips for current user:', error);
    }
    
    // Remove duplicates by trip ID
    const uniqueTrips = trips.filter((trip, index, self) => 
      index === self.findIndex(t => t.id === trip.id)
    );
    
    return uniqueTrips;
  } catch (error) {
    console.error('Error getting discoverable trips:', error);
    throw error;
  }
};

// Add an expense to a trip (using subcollection)
export const addExpenseToTrip = async (tripId: string, expense: Omit<Expense, 'id'>) => {
  try {
    const expenseWithId = {
      ...expense,
      id: Date.now().toString(), // Simple ID generation
    };
    
    // Add expense to the expenses subcollection
    const expenseId = await addDocument(`trips/${tripId}/expenses`, expenseWithId);
    
    return expenseId;
  } catch (error) {
    console.error('Error adding expense to trip:', error);
    throw error;
  }
};

// Get all expenses for a trip (using subcollection)
export const getTripExpenses = async (tripId: string) => {
  try {
    // Get expenses from the subcollection
    const expenses = await getAllDocuments(`trips/${tripId}/expenses`) as Expense[];
    return expenses;
  } catch (error) {
    console.error('Error getting trip expenses:', error);
    throw error;
  }
};

// Update an expense in a trip
export const updateTripExpense = async (tripId: string, expenseId: string, expenseData: Partial<Expense>) => {
  try {
    await updateDocument(`trips/${tripId}/expenses`, expenseId, expenseData);
    return expenseId;
  } catch (error) {
    console.error('Error updating trip expense:', error);
    throw error;
  }
};

// Delete an expense from a trip
export const deleteTripExpense = async (tripId: string, expenseId: string) => {
  try {
    await deleteDocument(`trips/${tripId}/expenses`, expenseId);
    return expenseId;
  } catch (error) {
    console.error('Error deleting trip expense:', error);
    throw error;
  }
};

// Subscribe to real-time expense updates for a trip
export const subscribeToTripExpenses = (tripId: string, callback: (expenses: Expense[]) => void) => {
  try {
    const unsubscribe = subscribeToCollection(
      `trips/${tripId}/expenses`,
      (documents: any[]) => {
        const expenses = documents.map(doc => ({
          id: doc.id,
          ...doc
        } as Expense));
        callback(expenses);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to trip expenses:', error);
    throw error;
  }
};

// Calculate payment splits for a trip
export const calculatePaymentSplits = async (tripId: string) => {
  try {
    const trip = await getDocument(TRIPS_COLLECTION, tripId) as SavedTrip | null;
    if (!trip) {
      throw new Error('Trip not found');
    }
    
    // Get expenses from the subcollection instead of from the trip document
    const expenses = await getTripExpenses(tripId);
    
    // The creator ID should be stored in the trip document when created
    // We'll use the userId field from the document if it exists, otherwise fallback to other possible fields
    const creatorId = (trip as any).userId || (trip as any).creatorId || (trip as any).createdBy;
    const allMembers = [creatorId, ...(trip.joiners || [])].filter(id => id); // Include creator and joiners, filter out undefined
    
    // Initialize payment calculations
    const paymentSplits: Record<string, { owes: Record<string, number>, owedBy: Record<string, number>, totalOwed: number, totalOwing: number }> = {};
    
    allMembers.forEach(memberId => {
      paymentSplits[memberId] = {
        owes: {},
        owedBy: {},
        totalOwed: 0,
        totalOwing: 0
      };
    });
    
    // Process each expense
    for (const expense of expenses) {
      const splitBetween = expense.splitBetween;
      const splitAmount = expense.amount / splitBetween.length;
      
      // Add to what the payer is owed by others
      for (const memberId of splitBetween) {
        if (memberId !== expense.paidBy) {
          if (!paymentSplits[expense.paidBy].owedBy[memberId]) {
            paymentSplits[expense.paidBy].owedBy[memberId] = 0;
          }
          paymentSplits[expense.paidBy].owedBy[memberId] += splitAmount;
          paymentSplits[expense.paidBy].totalOwed += splitAmount;
          
          if (!paymentSplits[memberId].owes[expense.paidBy]) {
            paymentSplits[memberId].owes[expense.paidBy] = 0;
          }
          paymentSplits[memberId].owes[expense.paidBy] += splitAmount;
          paymentSplits[memberId].totalOwing += splitAmount;
        }
      }
    }
    
    return paymentSplits;
  } catch (error) {
    console.error('Error calculating payment splits:', error);
    throw error;
  }
};