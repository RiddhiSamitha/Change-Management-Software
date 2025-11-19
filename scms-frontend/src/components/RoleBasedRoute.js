import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component wraps your pages to protect them
// It takes an array of roles that are allowed to see the page
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading user session...</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    // If not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Check if the user's role is in the allowed list
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not allowed, send them back to their main dashboard
    console.warn(`Access denied: User role "${user.role}" not in allowed roles:`, allowedRoles);
    return <Navigate to="/dashboard" replace />;
  }

  console.log(`✅ Access granted for role "${user.role}"`);
  // If all checks pass, render the page
  return children;
};

export default RoleBasedRoute;