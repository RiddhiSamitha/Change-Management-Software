import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, LayoutDashboard, FilePlus, ClipboardList, 
  Package, FileText, Settings, ShieldAlert, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // CORRECTED PATH

// Helper to create a nav link
const NavLink = ({ to, icon, text }) => (
  <Link
    to={to}
    className="group flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition duration-150 ease-in-out"
  >
    {React.cloneElement(icon, { className: 'text-gray-500 group-hover:text-blue-600 transition' })}
    <span className="ml-3 text-sm font-medium">{text}</span>
  </Link>
);

// This component renders the correct sidebar for each role
const RoleSidebar = ({ userRole }) => {
  const reviewDashboardRoute = "/reviewer-dashboard"; 
  
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
    case 'Technical Lead':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to={reviewDashboardRoute} icon={<ClipboardList size={18} />} text="Review Dashboard" />
          <NavLink to="/all-change-requests" icon={<FileText size={18} />} text="All Change Requests" />
        </nav>
      );

    case 'Change Manager':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to={reviewDashboardRoute} icon={<ClipboardList size={18} />} text="Review Dashboard" />
          <NavLink to="/workflow-config" icon={<Settings size={18} />} text="Workflow Config" />
          <NavLink to="/cab-meetings" icon={<Package size={18} />} text="CAB Meetings" />
          <NavLink to="/reports" icon={<FileText size={18} />} text="Reports" />
        </nav>
      );

    case 'Release Manager':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to={reviewDashboardRoute} icon={<ClipboardList size={18} />} text="Review Dashboard" />
          <NavLink to="/releases" icon={<Package size={18} />} text="Releases" />
          <NavLink to="/reports" icon={<FileText size={18} />} text="Reports" />
        </nav>
      );

    case 'System Administrator':
    case 'Admin':
      // Directs to Admin Dashboard.
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/admin-dashboard" icon={<ShieldAlert size={18} />} text="Admin Dashboard" />
        </nav>
      );
    
    case 'Auditor':
      return (
        <nav className="flex flex-col space-y-1">
          <NavLink to="/audit-logs" icon={<ClipboardList size={18} />} text="Audit Logs" />
          <NavLink to="/export-logs" icon={<FileText size={18} />} text="Export Logs" />
        </nav>
      );

    default:
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
    return null;
  }

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200 shadow-lg">
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <span className="text-xl font-extrabold text-blue-600">S C M S</span>
      </div>
      <div className="flex flex-col flex-grow p-4 space-y-6">
        <RoleSidebar userRole={user.role} />
        
        <div className="mt-auto">
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-1">
                <User size={16} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
            </div>
            <p className="text-xs text-blue-600 font-medium truncate ml-6">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 mt-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition duration-150 ease-in-out"
          >
            <LogOut size={18} />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}