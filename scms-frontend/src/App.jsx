import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Page Imports (Adjust these paths if your pages are in a different folder)
import Login from "./pages/Login"; 
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ReviewerDashboard from "./pages/ReviewerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SubmitCR from "./pages/SubmitCR";
import ViewCR from "./pages/ViewCR";
import EditCR from "./pages/EditCR";
import AuditDashboard from "./pages/AuditDashboard";

// Component Imports (Adjust these paths if components are in a different folder)
import Navigation from "./config/navigation"; 
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";

// --- DEFINED ROLE GROUPS FOR SIMPLIFICATION ---
const ADMIN_ROLES = ['Admin', 'System Administrator', 'Administrator'];
// Grouping Reviewer, Technical Lead, Change Manager, Release Manager, Auditor
const REVIEW_ROLES = ['Reviewer', 'Technical Lead', 'Change Manager', 'Release Manager', 'Auditor'];
// Grouping Developer, QA Engineer, DevOps Engineer
const DEV_ROLES = ['Developer', 'QA Engineer', 'DevOps Engineer'];


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

  // Check user roles for immediate redirection/fallback logic
  const isAdmin = user && ADMIN_ROLES.includes(user.role);
  const isReviewer = user && REVIEW_ROLES.includes(user.role);
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation /> 
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
            
          {/* 🚀 CORE FIX: ROLE-BASED REDIRECT FOR BASE/INDEX PATH */}
          {isAdmin ? (
              <Route index element={<Navigate to="/admin-dashboard" replace />} />
          ) : isReviewer ? (
              <Route index element={<Navigate to="/reviewer-dashboard" replace />} />
          ) : (
              <Route index element={<Navigate to="/dashboard" replace />} />
          )}

          {/* --- Admin Dashboard --- */}
          <Route path="/admin-dashboard" element={
            <RoleBasedRoute allowedRoles={ADMIN_ROLES}>
              <AdminDashboard />
            </RoleBasedRoute>
          } />

          {/* --- Developer Dashboard --- */}
          <Route path="/dashboard" element={
            <RoleBasedRoute allowedRoles={DEV_ROLES}>
              <Dashboard />
            </RoleBasedRoute>
          } />

          {/* --- Reviewer Dashboard (Primary) --- */}
          <Route path="/reviewer-dashboard" element={
            // Admins can also view the Reviewer dashboard content
            <RoleBasedRoute allowedRoles={[...REVIEW_ROLES, ...ADMIN_ROLES]}> 
              <ReviewerDashboard />
            </RoleBasedRoute>
          } />
          
          {/* --- All Change Requests (Reviewer view of all items) --- */}
          <Route path="/all-change-requests" element={
            <RoleBasedRoute allowedRoles={[...REVIEW_ROLES, ...ADMIN_ROLES]}>
              <ReviewerDashboard />
            </RoleBasedRoute>
          } />

          {/* --- Submit CR --- */}
          <Route path="/submit-cr" element={
            <RoleBasedRoute allowedRoles={DEV_ROLES}>
              <SubmitCR />
            </RoleBasedRoute>
          } />
          
          {/* --- VIEW/EDIT Routes --- */}
          <Route path="/cr/view/:id" element={
            <RoleBasedRoute allowedRoles={[...DEV_ROLES, ...REVIEW_ROLES, ...ADMIN_ROLES]}>
              <ViewCR />
            </RoleBasedRoute>
          } />
          <Route path="/cr/edit/:id" element={
            <RoleBasedRoute allowedRoles={DEV_ROLES}>
              <EditCR />
            </RoleBasedRoute>
          } />

          {/* --- Audit Routes --- */}
          <Route path="/audit-logs" element={
            <RoleBasedRoute allowedRoles={ADMIN_ROLES}> 
              <AuditDashboard />
            </RoleBasedRoute>
          } />
          
          {/* True 404 Fallback */}
          <Route path="*" element={<h1>404: Page Not Found</h1>} />
          
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