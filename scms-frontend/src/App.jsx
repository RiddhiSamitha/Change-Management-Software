import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Page Imports
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ReviewerDashboard from "./pages/ReviewerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SubmitCR from "./pages/SubmitCR";

// --- NEW PAGES ---
import ViewCR from "./pages/ViewCR";
import EditCR from "./pages/EditCR";

// Import your new components
import Navigation from "./config/navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";

// Import new placeholder pages
import AuditDashboard from "./pages/AuditDashboard";

// This component combines the Sidebar with the Page Content
function AppLayout() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-xl font-semibold">Loading session...</h1>
      </div>
    );
  }

  // Check user roles
  const isAdmin = user && ['Admin', 'System Administrator'].includes(user.role);
  const isReviewer = user && ['Reviewer', 'Technical Lead', 'Change Manager', 'Release Manager'].includes(user.role);
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation /> {/* The new dynamic sidebar */}
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          {/* --- Developer Dashboard --- */}
          <Route path="/dashboard" element={
            <RoleBasedRoute allowedRoles={['Developer', 'QA Engineer', 'DevOps Engineer']}>
              <Dashboard />
            </RoleBasedRoute>
          } />

          {/* --- Reviewer Dashboard --- */}
          <Route path="/reviewer-dashboard" element={
            <RoleBasedRoute allowedRoles={['Reviewer', 'Technical Lead', 'Change Manager', 'Release Manager', 'System Administrator', 'Admin']}>
              <ReviewerDashboard />
            </RoleBasedRoute>
          } />

          {/* --- Admin Dashboard --- FIXED: Added this route */}
          <Route path="/admin-dashboard" element={
            <RoleBasedRoute allowedRoles={['Admin', 'System Administrator']}>
              <AdminDashboard />
            </RoleBasedRoute>
          } />

          {/* --- Submit CR (Developer only) --- */}
          <Route path="/submit-cr" element={
            <RoleBasedRoute allowedRoles={['Developer', 'QA Engineer', 'DevOps Engineer']}>
              <SubmitCR />
            </RoleBasedRoute>
          } />
          
          {/* --- VIEW/EDIT Routes --- */}
          <Route path="/cr/view/:id" element={
            <RoleBasedRoute allowedRoles={['Developer', 'Technical Lead', 'Change Manager', 'Release Manager', 'QA Engineer', 'DevOps Engineer', 'System Administrator', 'Admin', 'Reviewer', 'Auditor']}>
              <ViewCR />
            </RoleBasedRoute>
          } />
          <Route path="/cr/edit/:id" element={
            <RoleBasedRoute allowedRoles={['Developer', 'QA Engineer', 'DevOps Engineer']}>
              <EditCR />
            </RoleBasedRoute>
          } />

          {/* --- Auditor Routes --- */}
          <Route path="/audit-logs" element={
            <RoleBasedRoute allowedRoles={['Auditor', 'System Administrator', 'Admin']}>
              <AuditDashboard />
            </RoleBasedRoute>
          } />
          
          {/* Fallback route - redirect based on role (FIXED: Proper priority) */}
          <Route path="*" element={
            isAdmin 
              ? <Navigate to="/admin-dashboard" replace />
              : isReviewer 
                ? <Navigate to="/reviewer-dashboard" replace /> 
                : <Navigate to="/dashboard" replace />
          } />
        </Routes>
      </main>
    </div>
  );
}

// --- Main Export: Wraps the entire application in the AuthProvider ---
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* All other routes are protected and use the AppLayout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}