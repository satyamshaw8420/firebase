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
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Generic function to add a document to a collection
export const addDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = doc(collection(db, collectionName));
    await setDoc(docRef, data);
    return docRef.id;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

// Generic function to get a document by ID from a collection
export const getDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const docData = docSnap.data() as DocumentData;
      return { id: docSnap.id, ...docData };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

// Generic function to get all documents from a collection
export const getAllDocuments = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents: any[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data() as DocumentData;
      documents.push({ id: doc.id, ...docData });
    });
    return documents;
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

// Generic function to update a document
export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
    return docId;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Generic function to delete a document
export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return docId;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Generic function to query documents with conditions
export const queryDocuments = async (
  collectionName: string,
  conditions: { field: string; operator: any; value: any }[],
  orderByField?: string,
  limitCount?: number
) => {
  try {
    let q: any = collection(db, collectionName);
    
    // Apply conditions
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
    
    // Apply ordering if specified
    if (orderByField) {
      q = query(q, orderBy(orderByField));
    }
    
    // Apply limit if specified
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const documents: any[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data() as DocumentData;
      documents.push({ id: doc.id, ...docData });
    });
    
    return documents;
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
};

// Generic function to subscribe to real-time document updates
export const subscribeToCollection = (
  collectionName: string,
  callback: (documents: any[]) => void,
  conditions?: { field: string; operator: any; value: any }[],
  orderByField?: string
) => {
  try {
    let q: any = collection(db, collectionName);
    
    // Apply conditions if specified
    if (conditions) {
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
    }
    
    // Apply ordering if specified
    if (orderByField) {
      q = query(q, orderBy(orderByField));
    }
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const documents: any[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data() as DocumentData;
        documents.push({ id: doc.id, ...docData });
      });
      callback(documents);
    }, (error) => {
      console.error('Error subscribing to collection:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up subscription:', error);
    throw error;
  }
};

// Community-specific functions
export const createCommunity = async (communityData: any) => {
  try {
    const docRef = doc(collection(db, 'communities'));
    await setDoc(docRef, {
      ...communityData as DocumentData,
      id: docRef.id,
      createdAt: serverTimestamp(),
      memberCount: 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
};

export const joinCommunity = async (communityId: string, userId: string, userAuthData?: any) => {
  try {
    const memberRef = doc(collection(db, 'communities', communityId, 'members'), userId);
    
    // Use a transaction to safely check and create membership
    const result = await runTransaction(db, async (transaction) => {
      const memberDoc = await getDoc(memberRef);
      
      if (memberDoc.exists()) {
        // User is already a member
        console.log('User is already a member of this community');
        return userId;
      }
      
      // Create the membership document
      transaction.set(memberRef, {
        userId,
        role: 'member',
        joinedAt: serverTimestamp(),
        status: 'active'
      });
      
      return userId;
    });
    
    // Update community member count atomically using a transaction
    try {
      const communityRef = doc(db, 'communities', communityId);
      await runTransaction(db, async (transaction) => {
        const communityDoc = await transaction.get(communityRef);
        if (communityDoc.exists()) {
          const currentCount = communityDoc.data().memberCount || 0;
          transaction.update(communityRef, { memberCount: currentCount + 1 });
        }
      });
    } catch (countError) {
      console.error('Error updating member count (membership still created):', countError);
      // Don't throw this error as the main membership was created successfully
    }
    
    // Ensure user profile exists in the users collection
    if (userAuthData) {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Create user profile if it doesn't exist
          await setDoc(userRef, {
            uid: userId,
            displayName: userAuthData.displayName || userAuthData.email?.split('@')[0],
            email: userAuthData.email,
            photoURL: userAuthData.photoURL,
            createdAt: serverTimestamp(),
            onboardingCompleted: false
          });
        } else {
          // Update user profile if needed (e.g., if photoURL changed)
          await updateDocument('users', userId, {
            photoURL: userAuthData.photoURL,
            displayName: userAuthData.displayName
          });
        }
      } catch (profileError) {
        console.error('Error ensuring user profile:', profileError);
        // Don't throw this error as the main membership was created successfully
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error joining community:', error);
    throw error;
  }
};

export const leaveCommunity = async (communityId: string, userId: string) => {
  try {
    // Remove the user from the community members first
    await deleteDoc(doc(collection(db, 'communities', communityId, 'members'), userId));
    
    // Update community member count atomically using a transaction
    try {
      const communityRef = doc(db, 'communities', communityId);
      await runTransaction(db, async (transaction) => {
        const communityDoc = await transaction.get(communityRef);
        if (communityDoc.exists()) {
          const currentCount = communityDoc.data().memberCount || 1;
          transaction.update(communityRef, { memberCount: Math.max(0, currentCount - 1) });
        }
      });
    } catch (countError) {
      console.error('Error updating member count after leaving (membership still removed):', countError);
      // Don't throw this error as the main membership removal was successful
    }
    
    return userId;
  } catch (error) {
    console.error('Error leaving community:', error);
    throw error;
  }
};

export const getCommunityMembers = async (communityId: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'communities', communityId, 'members'));
    const members: any[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data() as DocumentData;
      members.push({ id: doc.id, ...docData });
    });
    return members;
  } catch (error) {
    console.error('Error getting community members:', error);
    throw error;
  }
};

// Subscribe to community members with user data
export const subscribeToCommunityMembers = async (
  communityId: string,
  callback: (members: any[]) => void
) => {
  // First subscribe to the members collection
  const unsubscribe = subscribeToCollection(
    `communities/${communityId}/members`,
    async (memberDocs) => {
      // For each member, fetch their user data
      // Use Promise.all to ensure all user data is fetched before calling the callback
      const membersWithUserData = await Promise.all(
        memberDocs.map(async (memberDoc) => {
          try {
            // Get user data from the users collection
            const userDoc = await getDocument('users', memberDoc.userId);
            if (userDoc) {
              return {
                ...memberDoc as DocumentData,
                ...userDoc as DocumentData,
                id: memberDoc.id || memberDoc.userId
              };
            } else {
              // If user data doesn't exist, use the member data as is
              return {
                ...memberDoc as DocumentData,
                id: memberDoc.id || memberDoc.userId,
                name: 'Unknown User',
                avatar: '',
                handle: ''
              };
            }
          } catch (error) {
            console.error('Error fetching user data for member:', memberDoc.userId, error);
            // Use member data as fallback
            return {
              ...memberDoc as DocumentData,
              id: memberDoc.id || memberDoc.userId,
              name: 'Unknown User',
              avatar: '',
              handle: ''
            };
          }
        })
      );
      
      callback(membersWithUserData);
    }
  );
  
  return unsubscribe;
};

// Get community by ID
export const getCommunityById = async (communityId: string) => {
  try {
    const docRef = doc(db, 'communities', communityId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const docData = docSnap.data() as DocumentData;
      return { id: docSnap.id, ...docData };
    } else {
      console.log('No such community!');
      return null;
    }
  } catch (error) {
    console.error('Error getting community:', error);
    throw error;
  }
};

// Update community
export const updateCommunity = async (communityId: string, data: any) => {
  try {
    const docRef = doc(db, 'communities', communityId);
    await updateDoc(docRef, data);
    return communityId;
  } catch (error) {
    console.error('Error updating community:', error);
    throw error;
  }
};

// Delete community
export const deleteCommunity = async (communityId: string) => {
  try {
    await deleteDoc(doc(db, 'communities', communityId));
    return communityId;
  } catch (error) {
    console.error('Error deleting community:', error);
    throw error;
  }
};

// Check if user is a member of a community
export const isCommunityMember = async (communityId: string, userId: string) => {
  try {
    const memberRef = doc(db, 'communities', communityId, 'members', userId);
    const memberDoc = await getDoc(memberRef);
    return memberDoc.exists();
  } catch (error) {
    console.error('Error checking community membership:', error);
    return false; // Return false instead of throwing error to prevent blocking UI
  }
};

// Get community member by ID
export const getCommunityMember = async (communityId: string, memberId: string) => {
  try {
    const memberRef = doc(db, 'communities', communityId, 'members', memberId);
    const memberDoc = await getDoc(memberRef);
    
    if (memberDoc.exists()) {
      const docData = memberDoc.data() as DocumentData;
      return { id: memberDoc.id, ...docData };
    } else {
      console.log('No such member!');
      return null;
    }
  } catch (error) {
    console.error('Error getting community member:', error);
    throw error;
  }
};

// Update community member
export const updateCommunityMember = async (communityId: string, memberId: string, data: any) => {
  try {
    const memberRef = doc(db, 'communities', communityId, 'members', memberId);
    await updateDoc(memberRef, data);
    return memberId;
  } catch (error) {
    console.error('Error updating community member:', error);
    throw error;
  }
};

// Remove member from community
export const removeCommunityMember = async (communityId: string, memberId: string) => {
  try {
    await deleteDoc(doc(db, 'communities', communityId, 'members', memberId));
    
    // Update community member count atomically using a transaction
    const communityRef = doc(db, 'communities', communityId);
    await runTransaction(db, async (transaction) => {
      const communityDoc = await transaction.get(communityRef);
      if (communityDoc.exists()) {
        const currentCount = communityDoc.data().memberCount || 1;
        transaction.update(communityRef, { memberCount: Math.max(0, currentCount - 1) });
      }
    });
    
    return memberId;
  } catch (error) {
    console.error('Error removing community member:', error);
    throw error;
  }
};

// Make user admin of community
export const makeCommunityAdmin = async (communityId: string, memberId: string) => {
  try {
    return await updateCommunityMember(communityId, memberId, { role: 'admin' });
  } catch (error) {
    console.error('Error making community admin:', error);
    throw error;
  }
};

// Subscribe to community messages
export const subscribeToCommunityMessages = (
  communityId: string,
  callback: (messages: any[]) => void
) => {
  return subscribeToCollection(
    `communities/${communityId}/messages`,
    callback,
    [],
    'createdAt'
  );
};

// Add message to community
export const addCommunityMessage = async (communityId: string, messageData: any) => {
  try {
    const docRef = doc(collection(db, 'communities', communityId, 'messages'));
    await setDoc(docRef, {
      ...messageData as DocumentData,
      id: docRef.id,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding community message:', error);
    throw error;
  }
};

// Create a direct message chat between two users
export const createDirectMessageChat = async (user1Id: string, user2Id: string, user1Data: any, user2Data: any) => {
  try {
    // Create a chat document
    const chatRef = doc(collection(db, 'chats'));
    const chatId = chatRef.id;
    
    // Create chat data
    const chatData = {
      id: chatId,
      participants: [user1Id, user2Id],
      participantData: {
        [user1Id]: {
          name: user1Data.name || user1Data.displayName || 'User 1',
          avatar: user1Data.avatar || user1Data.photoURL || user1Data.profilePicture || 'https://i.pravatar.cc/150',
          handle: user1Data.handle || user1Data.email || user1Data.uid || 'user1',
          uid: user1Id
        },
        [user2Id]: {
          name: user2Data.name || user2Data.displayName || 'User 2',
          avatar: user2Data.avatar || user2Data.photoURL || user2Data.profilePicture || 'https://i.pravatar.cc/150',
          handle: user2Data.handle || user2Data.email || user2Data.uid || 'user2',
          uid: user2Id
        }
      },
      isGroup: false,
      isCommunityGroup: false,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTime: serverTimestamp()
    };
    
    // Save the chat
    await setDoc(chatRef, chatData);
    
    return chatId;
  } catch (error) {
    console.error('Error creating direct message chat:', error);
    throw error;
  }
};

// Create a community group chat
export const createCommunityGroupChat = async (communityId: string, groupName: string, creatorId: string, creatorData: any, initialMembers: any[]) => {
  try {
    // Create a chat document
    const chatRef = doc(collection(db, 'chats'));
    const chatId = chatRef.id;
    
    // Build participant data map
    const participantData = {};
    
    // Add creator
    const creatorUid = creatorData.uid || creatorId;
    participantData[creatorUid] = {
      name: creatorData.name || creatorData.displayName || 'User',
      avatar: creatorData.avatar || creatorData.photoURL || creatorData.profilePicture || 'https://i.pravatar.cc/150',
      handle: creatorData.handle || creatorData.email || creatorUid || 'user',
      uid: creatorUid
    };
    
    // Add initial members
    initialMembers.forEach(member => {
      const memberId = member.uid || member.userId;
      if (memberId && memberId !== creatorId) { // Avoid duplicate and check if memberId exists
        participantData[memberId] = {
          name: member.name || member.displayName || 'User',
          avatar: member.avatar || member.photoURL || member.profilePicture || 'https://i.pravatar.cc/150',
          handle: member.handle || member.email || memberId || 'user',
          uid: memberId
        };
      }
    });
    
    // Create chat data
    const chatData = {
      id: chatId,
      communityId: communityId,
      groupName: groupName,
      participants: Object.keys(participantData),
      participantData: participantData,
      isGroup: true,
      isCommunityGroup: true,
      maxMembers: 20,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      createdBy: creatorId
    };
    
    // Save the chat
    await setDoc(chatRef, chatData);
    
    return chatId;
  } catch (error) {
    console.error('Error creating community group chat:', error);
    throw error;
  }
};

// Add a message to a direct message chat
export const addDirectMessage = async (chatId: string, messageData: any) => {
  try {
    const docRef = doc(collection(db, 'chats', chatId, 'messages'));
    const messageWithTimestamp = {
      ...messageData as DocumentData,
      id: docRef.id,
      createdAt: serverTimestamp(),
      status: 'sent', // sent, delivered, read
      deliveredAt: null,
      readAt: null
    };
    await setDoc(docRef, messageWithTimestamp);
    
    // Update the chat's last message
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: messageData.text,
      lastMessageTime: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding direct message:', error);
    throw error;
  }
};

// Get existing chat between two users
export const getExistingChat = async (user1Id: string, user2Id: string) => {
  try {
    // First, try to find chats where user1 is a participant
    const q1 = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user1Id)
    );
    
    const querySnapshot1 = await getDocs(q1);
    
    // Filter results to find chats that also contain user2
    const matchingChat = querySnapshot1.docs.find(doc => {
      const data = doc.data() as DocumentData;
      return data.participants && data.participants.includes(user2Id);
    });
    
    if (matchingChat) {
      const chatData = matchingChat.data() as DocumentData;
      return { id: matchingChat.id, ...chatData };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting existing chat:', error);
    throw error;
  }
};

// Update message status to delivered
export const markMessageAsDelivered = async (chatId: string, messageId: string) => {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      status: 'delivered',
      deliveredAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error marking message as delivered:', error);
    throw error;
  }
};

// Update message status to read
export const markMessageAsRead = async (chatId: string, messageId: string) => {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      status: 'read',
      readAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Set user as typing in a chat
export const setUserTyping = async (chatId: string, userId: string, isTyping: boolean) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const typingData = {};
    typingData[`typing.${userId}`] = isTyping ? serverTimestamp() : null;
    await updateDoc(chatRef, typingData);
    return true;
  } catch (error) {
    console.error('Error setting user typing status:', error);
    throw error;
  }
};

// Get users who are typing in a chat
export const getTypingUsers = async (chatId: string) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const data = chatSnap.data() as DocumentData;
      return data.typing || {};
    }
    return {};
  } catch (error) {
    console.error('Error getting typing users:', error);
    throw error;
  }
};

// Delete a message
export const deleteMessage = async (chatId: string, messageId: string) => {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await deleteDoc(messageRef);
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Add a user to a group chat
export const addUserToGroupChat = async (chatId: string, userData: any) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      throw new Error('Chat not found');
    }
    
    const chatData = chatSnap.data() as DocumentData;
    
    // Check if user is already in the group
    if (chatData.participants.includes(userData.uid)) {
      throw new Error('User is already in the group');
    }
    
    // Check if group is at max capacity
    if (chatData.participants.length >= (chatData.maxMembers || 20)) {
      throw new Error('Group is at maximum capacity');
    }
    
    // Add user to participants array
    const updatedParticipants = [...chatData.participants as unknown[], userData.uid];
    
    // Add user to participantData
    const updatedParticipantData = {
      ...(chatData.participantData as DocumentData),
      [userData.uid]: {
        name: userData.name || userData.displayName || 'User',
        avatar: userData.avatar || userData.photoURL || userData.profilePicture || 'https://i.pravatar.cc/150',
        handle: userData.handle || userData.email || userData.uid || 'user',
        uid: userData.uid
      }
    };
    
    // Update the chat document
    await updateDoc(chatRef, {
      participants: updatedParticipants,
      participantData: updatedParticipantData
    });
    
    return true;
  } catch (error) {
    console.error('Error adding user to group chat:', error);
    throw error;
  }
};

// Remove a user from a group chat
export const removeUserFromGroupChat = async (chatId: string, userId: string) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      throw new Error('Chat not found');
    }
    
    const chatData = chatSnap.data() as DocumentData;
    
    // Check if user is in the group
    if (!chatData.participants.includes(userId)) {
      throw new Error('User is not in the group');
    }
    
    // Remove user from participants array
    const updatedParticipants = (chatData.participants as unknown[]).filter((id: string) => id !== userId);
    
    // Remove user from participantData
    const updatedParticipantData = { ...(chatData.participantData as DocumentData) };
    delete updatedParticipantData[userId];
    
    // Update the chat document
    await updateDoc(chatRef, {
      participants: updatedParticipants,
      participantData: updatedParticipantData
    });
    
    return true;
  } catch (error) {
    console.error('Error removing user from group chat:', error);
    throw error;
  }
};



// Function to upload a file to Firebase Storage and return the download URL
export const uploadFile = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
