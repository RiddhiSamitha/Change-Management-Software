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
import SubmitCR from "./pages/SubmitCR";

// Import your new components
import Navigation from "./config/navigation";
import ProtectedRoute from "./components/ProtectedRoute"; // We still use this
import RoleBasedRoute from "./components/RoleBasedRoute";

// Import new placeholder pages
import AuditDashboard from "./pages/AuditDashboard";
// ... import other new pages like WorkflowConfig, CABMeetings etc...

// This component combines the Sidebar with the Page Content
function AppLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-xl font-semibold">Loading session...</h1>
      </div>
    );
  }
  
  // Your new UI has a permanent sidebar
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation /> {/* The new dynamic sidebar */}
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          {/* --- Developer Routes --- */}
          <Route path="/dashboard" element={
            <RoleBasedRoute allowedRoles={['Developer', 'Technical Lead', 'Change Manager', 'Release Manager', 'QA Engineer', 'DevOps Engineer', 'System Admin']}>
              <Dashboard />
            </RoleBasedRoute>
          } />
          <Route path="/submit-cr" element={
            <RoleBasedRoute allowedRoles={['Developer']}>
              <SubmitCR />
            </RoleBasedRoute>
          } />

          {/* --- Auditor Routes --- */}
          <Route path="/audit-logs" element={
            <RoleBasedRoute allowedRoles={['Auditor']}>
              <AuditDashboard />
            </RoleBasedRoute>
          } />
          
          {/* TODO: Add routes for other roles here */}
          {/* <Route path="/workflow-config" element={<RoleBasedRoute allowedRoles={['Change Manager']}><WorkflowConfig /></RoleBasedRoute>} /> */}

          {/* Fallback route for logged-in users */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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