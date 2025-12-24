import { auth, db } from './firebase/firebaseConfig';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

// Test Firebase Authentication
export const testFirebaseAuth = () => {
  console.log('Firebase Auth initialized:', !!auth);
  return !!auth;
};

// Test Firebase Firestore
export const testFirebaseFirestore = async () => {
  try {
    // Try to access the database
    const testCollection = collection(db, 'test');
    console.log('Firebase Firestore initialized:', !!db);
    return !!db;
  } catch (error) {
    console.error('Firebase Firestore test failed:', error);
    return false;
  }
};

// Test writing to Firestore
export const testFirestoreWrite = async () => {
  try {
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Hello Firebase!',
      timestamp: serverTimestamp()
    });
    console.log('Document written with ID: ', docRef.id);
    return true;
  } catch (error) {
    console.error('Error adding document: ', error);
    return false;
  }
};

// Test reading from Firestore
export const testFirestoreRead = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('Documents in test collection: ', querySnapshot.size);
    return true;
  } catch (error) {
    console.error('Error getting documents: ', error);
    return false;
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('Running Firebase tests...');
  
  const authTest = testFirebaseAuth();
  console.log('Authentication test:', authTest ? 'PASSED' : 'FAILED');
  
  const firestoreTest = await testFirebaseFirestore();
  console.log('Firestore test:', firestoreTest ? 'PASSED' : 'FAILED');
  
  if (firestoreTest) {
    const writeTest = await testFirestoreWrite();
    console.log('Firestore write test:', writeTest ? 'PASSED' : 'FAILED');
    
    const readTest = await testFirestoreRead();
    console.log('Firestore read test:', readTest ? 'PASSED' : 'FAILED');
  }
  
  console.log('Firebase tests completed.');
};