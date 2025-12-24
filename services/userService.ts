import { getDocument, subscribeToCollection } from '../firebase/dbService';
import { UserData } from '../types';

/**
 * Check if user has completed onboarding
 * @param userId - The Firebase user ID
 * @returns Boolean indicating if onboarding is completed
 */
export const isOnboardingCompleted = async (userId: string): Promise<boolean> => {
  try {
    const userData = await getDocument('users', userId) as UserData | null;
    return userData?.onboardingCompleted === true || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Get user profile data
 * @param userId - The Firebase user ID
 * @returns User profile data or null if not found
 */
export const getUserProfile = async (userId: string) => {
  try {
    const userData = await getDocument('users', userId) as UserData | null;
    return userData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export { subscribeToCollection };