import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, FilePlus, ShieldCheck, ClipboardList, Package, TestTube, Webhook, FileText, Settings, ShieldAlert, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Helper to create a nav link
const NavLink = ({ to, icon, text }) => (
  <Link
    to={to}
    className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
  >
    {icon}
    <span className="ml-3 text-sm font-medium">{text}</span>
  </Link>
);

// This component renders the correct sidebar for each role
const RoleSidebar = ({ userRole }) => {
  switch (userRole) {
    case 'Developer':
    case 'QA Engineer':
    case 'DevOps Engineer':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/dashboard" icon={<LayoutDashboard size={18} />} text="My Dashboard" />
          <NavLink to="/submit-cr" icon={<FilePlus size={18} />} text="Submit New CR" />
        </nav>
      );
    
    case 'Reviewer':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/reviewer-dashboard" icon={<ClipboardList size={18} />} text="Review Dashboard" />
          <NavLink to="/reviewer-dashboard" icon={<ShieldCheck size={18} />} text="Pending Approvals" />
        </nav>
      );
    
    case 'Technical Lead':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/reviewer-dashboard" icon={<ClipboardList size={18} />} text="Review Dashboard" />
          <NavLink to="/reviewer-dashboard" icon={<ShieldCheck size={18} />} text="Pending Reviews" />
        </nav>
      );

    case 'Change Manager':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/reviewer-dashboard" icon={<LayoutDashboard size={18} />} text="Review Dashboard" />
          <NavLink to="/workflow-config" icon={<Settings size={18} />} text="Workflow Config" />
          <NavLink to="/cab-meetings" icon={<Package size={18} />} text="CAB Meetings" />
          <NavLink to="/reports" icon={<FileText size={18} />} text="Reports" />
        </nav>
      );

    case 'Release Manager':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/reviewer-dashboard" icon={<LayoutDashboard size={18} />} text="Review Dashboard" />
          <NavLink to="/releases" icon={<Package size={18} />} text="Releases" />
          <NavLink to="/reports" icon={<FileText size={18} />} text="Reports" />
        </nav>
      );

    case 'System Administrator':
    case 'Admin':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/admin-dashboard" icon={<ShieldAlert size={18} />} text="Admin Dashboard" />
          <NavLink to="/reviewer-dashboard" icon={<LayoutDashboard size={18} />} text="Review Dashboard" />
          <NavLink to="/audit-logs" icon={<ShieldAlert size={18} />} text="Audit Logs" />
        </nav>
      );
    
    case 'Auditor':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/audit-logs" icon={<ShieldAlert size={18} />} text="Audit Logs" />
          <NavLink to="/export-logs" icon={<FileText size={18} />} text="Export Logs" />
        </nav>
      );

    default:
      // Fallback for any other roles
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/dashboard" icon={<LayoutDashboard size={18} />} text="Dashboard" />
        </nav>
      );
  }
};

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return null; // Don't render anything if not logged in
  }

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <span className="text-xl font-bold text-gray-800">SCMS</span>
      </div>
      <div className="flex flex-col flex-grow p-4 space-y-4">
        {/* The dynamic navigation links based on user role */}
        <RoleSidebar userRole={user.role} />
        
        {/* User info and logout at the bottom */}
        <div className="mt-auto">
          <div className="p-3 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
          >
            <LogOut size={18} />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}