import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, role, requiresCompletion = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // STRICT WORKFLOW ENFORCEMENT
  
  // 1. If user is pending HR approval, they can ONLY access waiting page
  if (user.status === 'pending_hr') {
    // Allow access to waiting page
    if (window.location.pathname === '/waiting') {
      return children;
    }
    // Redirect to waiting page from anywhere else
    return <Navigate to="/waiting" replace />;
  }

  // 2. If user is approved but hasn't completed profile (no bank/linkedin)
  // They can ONLY access complete-profile page
  if (user.status === 'approved' && !user.profileComplete) {
    // Allow access to complete-profile page
    if (window.location.pathname === '/employee/complete-profile') {
      return children;
    }
    // Redirect to complete-profile from anywhere else
    return <Navigate to="/employee/complete-profile" replace />;
  }

  // 3. If profile is complete, allow normal navigation
  // Check role-based access
  if (role) {
    // HR can access both employee and hr routes
    if (role === 'employee' && user.role === 'hr') {
      return children;
    }
    
    // Regular role check
    if (user.role !== role) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
