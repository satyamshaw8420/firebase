import { auth } from './firebaseConfig';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Set persistence to local storage
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Sign in with Google
export const signInWithGooglePopup = async () => {
  try {
    // Add additional configuration to handle popup issues
    googleProvider.setCustomParameters({
      prompt: 'select_account' // Forces account selection
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Handle specific error codes
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Popup was closed by the user');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.log('Popup request was cancelled');
    }
    
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