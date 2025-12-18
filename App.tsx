import React from 'react';
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

const { HashRouter: Router, Routes, Route } = ReactRouterDOM;

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
            <Route path="/destination" element={<Destination />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/community" element={<Community />} />
            <Route path="/guides" element={<Guides />} />
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