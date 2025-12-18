# Firebase Integration Guide for TravelEase

This guide explains how to set up Firebase authentication and database integration in your TravelEase application.

## Prerequisites

1. You need to have a Firebase project created in the Firebase Console.
2. You need to have the Firebase CLI installed (optional but recommended).

## Step 1: Install Firebase Dependencies

We've already installed the Firebase package in your project:

```bash
npm install firebase
```

## Step 2: Firebase Configuration

We created a Firebase configuration file at `firebase/firebaseConfig.ts`:

```typescript
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
```

## Step 3: Environment Variables

We've updated your `.env` file to include Firebase configuration variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

You need to replace these placeholder values with your actual Firebase project configuration:
1. Go to the Firebase Console (https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (Project settings)
4. Scroll down to "Your apps" section
5. If you don't have a web app, click "Add app" and follow the steps
6. Copy the configuration values to your `.env` file

## Step 4: Authentication Service

We created Firebase authentication service at `firebase/authService.ts`:

```typescript
import { auth } from './firebaseConfig';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
```

## Step 5: Database Service

We created Firebase database service at `firebase/dbService.ts` with generic functions for CRUD operations:

```typescript
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
  limit
} from 'firebase/firestore';

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
      return { id: docSnap.id, ...docSnap.data() };
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
      documents.push({ id: doc.id, ...doc.data() });
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
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    return documents;
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
};
```

## Step 6: Trip Service

We created a specialized service for trip management at `firebase/tripService.ts`:

```typescript
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
```

## Step 7: Updated Components

We've updated your application components to use Firebase instead of localStorage:

### AuthContext.tsx

Updated to use Firebase authentication:

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChange } from '../firebase/authService';

interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

### SignIn.tsx

Updated to use Firebase authentication:

```typescript
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { signInWithGooglePopup, signOutUser } from '../firebase/authService';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti';

const { useNavigate, Link } = ReactRouterDOM;

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { currentUser } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGooglePopup();
      
      // Log the full user object as requested
      console.log("User successfully logged in:", user);
      
      // Check if this is the user's first login
      const isFirstLogin = !localStorage.getItem('hasLoggedInBefore');
      
      // Show success toast
      toast.success(`Welcome, ${user.displayName || user.email}!`);
      
      // Show confetti for first-time login
      if (isFirstLogin) {
        setShowConfetti(true);
        localStorage.setItem('hasLoggedInBefore', 'true');
        // Hide confetti after 5 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
      }
      
      // Navigate to homepage
      navigate('/');
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      // Handle generic errors
      setError("Failed to sign in. Please try again.");
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // ... rest of the component
```

### CreateTrip.tsx

Updated to save trips to Firebase:

```typescript
// Added imports
import { addTrip, updateTrip } from '../firebase/tripService';
import { useAuth } from '../contexts/AuthContext';

// In the component
const { currentUser } = useAuth();

// Updated handleGenerate function
const handleGenerate = async () => {
  // ... validation code ...

  if (!currentUser) {
      alert("You must be logged in to create a trip.");
      return;
  }

  setLoading(true);
  try {
    const result = await generateItinerary(finalPrefs);
    setItinerary(result);
    
    if (editingId) {
        // Update existing trip in Firebase
        await updateTrip(editingId, { 
          ...result, 
          preferences: finalPrefs 
        });
    } else {
        // Create new trip in Firebase
        const newTrip = { 
          ...result, 
          userId: currentUser.uid,
          createdAt: Date.now(), 
          preferences: finalPrefs,
          isBooked: false
        };
        await addTrip(newTrip);
    }
  } catch (err) {
    alert("Failed to generate trip. Please try again.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

### MyTrips.tsx

Updated to load and manage trips from Firebase:

```typescript
// Added imports
import { getUserTrips, deleteTrip, updateTrip } from '../firebase/tripService';

// Updated component state
const [loading, setLoading] = useState(true);

// Updated useEffect to load trips from Firebase
useEffect(() => {
  // Only load trips if user is authenticated
  const loadTrips = async () => {
    if (currentUser) {
      try {
        const userTrips = await getUserTrips(currentUser.uid);
        setTrips(userTrips);
      } catch (error) {
        console.error('Error loading trips:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  loadTrips();
}, [currentUser]);

// Updated delete function
const handleDeleteTrip = async (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  try {
    await deleteTrip(id);
    const updated = trips.filter(t => t.id !== id);
    setTrips(updated);
    if (selectedTrip?.id === id) setSelectedTrip(null);
  } catch (error) {
    console.error('Error deleting trip:', error);
    alert('Failed to delete trip. Please try again.');
  }
};

// Updated update and book functions
const handleUpdateTrip = async (updatedItinerary: Itinerary) => {
  if (!selectedTrip) return;
  
  try {
    const updatedTrip = { ...selectedTrip, ...updatedItinerary };
    await updateTrip(selectedTrip.id, updatedTrip);
    
    const updatedTripsList = trips.map(t => t.id === selectedTrip.id ? updatedTrip : t);
    setTrips(updatedTripsList);
    setSelectedTrip(updatedTrip); // Update current view
  } catch (error) {
    console.error('Error updating trip:', error);
    alert('Failed to update trip. Please try again.');
  }
};

const handleBookTrip = async () => {
  if (!selectedTrip) return;
  
  try {
    const bookedTrip = { ...selectedTrip, isBooked: true };
    await updateTrip(selectedTrip.id, bookedTrip);
    
    const updatedTripsList = trips.map(t => t.id === selectedTrip.id ? bookedTrip : t);
    setTrips(updatedTripsList);
    setSelectedTrip(bookedTrip);
  } catch (error) {
    console.error('Error booking trip:', error);
    alert('Failed to book trip. Please try again.');
  }
};
```

## Testing Firebase Integration

We've created test files to verify Firebase integration:

1. `test-firebase.ts` - Contains functions to test Firebase authentication and database connectivity
2. `src/TestComponents.tsx` - A React component to display test results

To run the tests:
1. Make sure your Firebase configuration in `.env` is correct
2. Start your development server with `npm run dev`
3. Navigate to the test component to see results

## Security Rules

For production, you should set up Firebase security rules to protect your data. Here's a basic example for Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Trips can only be read, updated, or deleted by their owner
    match /trips/{tripId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Other collections can be protected similarly
  }
}
```

## Next Steps

1. Replace the placeholder values in your `.env` file with your actual Firebase configuration
2. Deploy your security rules to Firestore
3. Test the authentication and database functionality
4. Customize the Firebase integration based on your specific requirements

## Troubleshooting

1. **Firebase not initializing**: Check that all environment variables are correctly set in your `.env` file
2. **Authentication not working**: Verify that you've enabled Google authentication in the Firebase Console
3. **Database operations failing**: Check your Firestore security rules and ensure they allow the operations you're trying to perform
4. **Network errors**: Ensure your development server has internet access and that Firebase isn't blocked by a firewall

If you encounter any issues, check the browser console for error messages and consult the Firebase documentation.