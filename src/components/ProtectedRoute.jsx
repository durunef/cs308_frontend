import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // If user is not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    // Extract the current path to redirect back after login
    const currentPath = location.pathname;
    const searchParams = new URLSearchParams();
    searchParams.append('redirect', currentPath);
    
    return <Navigate to={`/login?${searchParams.toString()}`} replace />;
  }
  
  // If authenticated, render the protected component
  return children;
}

export default ProtectedRoute; 