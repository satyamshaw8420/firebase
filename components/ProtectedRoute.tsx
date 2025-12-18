import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Navigate } = ReactRouterDOM;

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  // If there's no current user, redirect to the sign-in page
  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  // If user is authenticated, render the protected content
  return <>{children}</>;
};