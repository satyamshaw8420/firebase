import { addDocument, getDocument, getAllDocuments, updateDocument, deleteDocument, queryDocuments } from './dbService';
import { SavedTrip } from '../types';

// Collection name for trips
const TRIPS_COLLECTION = 'trips';

// Add a new trip
export const addTrip = async (trip: Omit<SavedTrip, 'id'>) => {
  try {
    const tripId = await addDocument(TRIPS_COLLECTION, trip);
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
export const getTrip = async (tripId: string) => {
  try {
    const trip = await getDocument(TRIPS_COLLECTION, tripId);
    return trip;
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
};

// Get all trips for a user
export const getUserTrips = async (userId: string) => {
  try {
    const trips = await queryDocuments(
      TRIPS_COLLECTION,
      [{ field: 'userId', operator: '==', value: userId }]
    );
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
export const getAllTrips = async () => {
  try {
    const trips = await getAllDocuments(TRIPS_COLLECTION);
    return trips;
  } catch (error) {
    console.error('Error getting all trips:', error);
    throw error;
  }
};

// Get discoverable trips for community members
export const getDiscoverableTrips = async (communityMemberIds: string[], currentUserId: string) => {
  try {
    // Query trips that belong to community members but exclude current user's trips
    const trips = [];
    
    // Since we can't directly query all trips due to security rules,
    // we need to query each user's trips individually
    for (const userId of communityMemberIds) {
      if (userId !== currentUserId) {
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
    }
    
    return trips;
  } catch (error) {
    console.error('Error getting discoverable trips:', error);
    throw error;
  }
};