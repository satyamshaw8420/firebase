import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import CreateTrip from './pages/CreateTrip';
import MyTrips from './pages/MyTrips';
import Destination from './pages/Destination';
import Compare from './pages/Compare';
import Community from './pages/Community';
import Guides from './pages/Guides';
import SignIn from './pages/SignIn';
import FAQ from './pages/FAQ';
import ContactUs from './pages/ContactUs';
import TestComponents from './src/TestComponents';
import { motion } from 'framer-motion';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { isOnboardingCompleted } from './services/userService';
import { subscribeToCollection } from './firebase/dbService';
import Onboarding from './components/Onboarding';

const { HashRouter: Router, Routes, Route } = ReactRouterDOM;

const CommunityWrapper: React.FC = () => {
  const { currentUser } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState<boolean>(true);

  // Check if user has completed onboarding using real-time listener
  useEffect(() => {
    if (currentUser) {
      // Set up real-time listener for user document
      const unsubscribe = subscribeToCollection(
        'users',
        (users) => {
          // Find the current user's document
          const currentUserDoc = users.find(user => user.uid === currentUser.uid);
          if (currentUserDoc) {
            setOnboardingComplete(currentUserDoc.onboardingCompleted === true);
          } else {
            // If user document doesn't exist, onboarding is not complete
            setOnboardingComplete(false);
          }
          setCheckingOnboarding(false);
        },
        [{ field: 'uid', operator: '==', value: currentUser.uid }]
      );
      
      return () => unsubscribe();
    } else {
      setCheckingOnboarding(false);
    }
  }, [currentUser]);

  // If there's no current user, redirect to the sign-in page
  if (!currentUser) {
    return <SignIn />;
  }

  // Show loading state while checking onboarding status
  if (checkingOnboarding) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not complete
  if (!onboardingComplete) {
    return <Onboarding onComplete={() => setOnboardingComplete(true)} />;
  }

  // If user is authenticated and onboarding is complete, render the Community component
  return <Community />;
};

const App: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/create-trip" element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            } />
            <Route path="/my-trips" element={
              <ProtectedRoute>
                <MyTrips />
              </ProtectedRoute>
            } />
            <Route path="/destination" element={
              <ProtectedRoute>
                <Destination />
              </ProtectedRoute>
            } />
            <Route path="/compare" element={
              <ProtectedRoute>
                <Compare />
              </ProtectedRoute>
            } />
            <Route path="/community" element={<CommunityWrapper />} />
            <Route path="/guides" element={
              <ProtectedRoute>
                <Guides />
              </ProtectedRoute>
            } />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/test" element={<TestComponents />} />
            {/* Fallback for other routes */}
            <Route path="*" element={<div className="p-10 text-center">Hold on! Coming Soon 😎</div>} />
          </Routes>
        </Layout>
      </Router>
    </motion.div>
  );
};

export default App;