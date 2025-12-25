import { db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { subscribeToCollection } from './dbService';

// Community data interfaces
export interface CommunityMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: any;
  status: 'active' | 'inactive';
}

export interface Community {
  id?: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: any;
  memberCount: number;
  imageUrl?: string;
  isPublic: boolean;
  inviteCode?: string;
}

// Create a new community
export const createCommunity = async (communityData: Omit<Community, 'id' | 'createdAt' | 'memberCount'>) => {
  try {
    console.log('Creating community with data:', communityData);
    const communityRef = doc(collection(db, 'communities'));
    const newCommunity: Community = {
      ...communityData,
      id: communityRef.id,
      createdAt: serverTimestamp(),
      memberCount: 0
    };
    
    console.log('Setting community document:', newCommunity);
    await setDoc(communityRef, newCommunity);
    
    // Add creator as admin member
    console.log('Adding creator as admin member:', communityRef.id, communityData.createdBy);
    await addCommunityMember(communityRef.id, communityData.createdBy, 'admin');
    
    console.log('Community created successfully with ID:', communityRef.id);
    return communityRef.id;
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
};

// Get a community by ID
export const getCommunity = async (communityId: string) => {
  try {
    const docRef = doc(db, 'communities', communityId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Community;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting community:', error);
    throw error;
  }
};

// Get all communities
export const getAllCommunities = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'communities'));
    const communities: Community[] = [];
    querySnapshot.forEach((doc) => {
      communities.push({ id: doc.id, ...doc.data() } as Community);
    });
    return communities;
  } catch (error) {
    console.error('Error getting communities:', error);
    throw error;
  }
};

// Update a community
export const updateCommunity = async (communityId: string, data: Partial<Community>) => {
  try {
    const docRef = doc(db, 'communities', communityId);
    await updateDoc(docRef, data);
    return communityId;
  } catch (error) {
    console.error('Error updating community:', error);
    throw error;
  }
};

// Delete a community
export const deleteCommunity = async (communityId: string) => {
  try {
    await deleteDoc(doc(db, 'communities', communityId));
    return communityId;
  } catch (error) {
    console.error('Error deleting community:', error);
    throw error;
  }
};

// Add a member to a community
export const addCommunityMember = async (communityId: string, userId: string, role: 'admin' | 'member' = 'member') => {
  try {
    console.log('Adding community member:', { communityId, userId, role });
    const memberRef = doc(collection(db, 'communities', communityId, 'members'), userId);
    const memberData: CommunityMember = {
      userId,
      role,
      joinedAt: serverTimestamp(),
      status: 'active'
    };
    
    console.log('Setting member document:', memberData);
    await setDoc(memberRef, memberData);
    
    // Update community member count
    console.log('Updating community member count for:', communityId);
    const communityRef = doc(db, 'communities', communityId);
    const communityDoc = await getDoc(communityRef);
    if (communityDoc.exists()) {
      const currentCount = communityDoc.data().memberCount || 0;
      console.log('Current member count:', currentCount);
      await updateDoc(communityRef, { memberCount: currentCount + 1 });
      console.log('Updated member count to:', currentCount + 1);
    }
    
    console.log('Community member added successfully:', userId);
    return userId;
  } catch (error) {
    console.error('Error adding community member:', error);
    throw error;
  }
};

// Remove a member from a community
export const removeCommunityMember = async (communityId: string, userId: string) => {
  try {
    await deleteDoc(doc(collection(db, 'communities', communityId, 'members'), userId));
    
    // Update community member count
    const communityRef = doc(db, 'communities', communityId);
    const communityDoc = await getDoc(communityRef);
    if (communityDoc.exists()) {
      const currentCount = communityDoc.data().memberCount || 1;
      await updateDoc(communityRef, { memberCount: Math.max(0, currentCount - 1) });
    }
    
    return userId;
  } catch (error) {
    console.error('Error removing community member:', error);
    throw error;
  }
};

// Get community members
export const getCommunityMembers = async (communityId: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'communities', communityId, 'members'));
    const members: CommunityMember[] = [];
    querySnapshot.forEach((doc) => {
      members.push({ userId: doc.id, ...doc.data() } as CommunityMember);
    });
    return members;
  } catch (error) {
    console.error('Error getting community members:', error);
    throw error;
  }
};

// Subscribe to community members (real-time)
export const subscribeToCommunityMembers = (
  communityId: string,
  callback: (members: CommunityMember[]) => void
) => {
  return subscribeToCollection(
    `communities/${communityId}/members`,
    (documents) => {
      callback(documents as CommunityMember[]);
    }
  );
};

// Check if user is a member of a community
export const isCommunityMember = async (communityId: string, userId: string) => {
  try {
    const docRef = doc(db, 'communities', communityId, 'members', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking community membership:', error);
    throw error;
  }
};

// Get communities for a user
export const getUserCommunities = async (userId: string) => {
  try {
    // This would require a more complex query or a separate user-communities collection
    // For now, we'll get all communities and filter on the client side
    const allCommunities = await getAllCommunities();
    // In a production app, you'd want to optimize this with a better query structure
    return allCommunities;
  } catch (error) {
    console.error('Error getting user communities:', error);
    throw error;
  }
};