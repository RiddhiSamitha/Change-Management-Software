import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  // Use isAuthenticated() and loading from the context
  const { isAuthenticated, loading } = useAuth();

  // 1. If still loading the session from localStorage, wait.
  // This prevents flickering/premature redirect.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading user session...</p>
      </div>
    );
  }

  // 2. CRITICAL CHECK: If session is not authenticated (i.e., NO TOKEN is present)
  // This relies on isAuthenticated() checking both 'token' and 'user'.
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // 3. Otherwise, render the page
  return children;
}