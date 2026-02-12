import { auth } from './firebaseConfig';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Forces account selection
});

// Set persistence to local storage
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Handle redirect result (call this on app load)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    throw error;
  }
};

// Sign in with Google (Popup)
export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Silently log common user actions
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Popup was closed by the user');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.log('Popup request was cancelled');
    } else {
      console.error('Error signing in with Google Popup:', error);
    }
    throw error;
  }
};

// Sign in with Google (Redirect) - More robust for mobie/popup-blockers
export const signInWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in with Google Redirect:', error);
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