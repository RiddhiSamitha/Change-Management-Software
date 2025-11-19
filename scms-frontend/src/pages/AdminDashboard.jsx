import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
// WARNING FIX: Removed 'crAPI' as it is no longer used in this component
import { adminAPI } from '../config/api'; 
import { 
    Users, FileText, TrendingUp, UserPlus, Edit, Trash2, 
    Shield, Activity, 
    CheckCircle, // ERROR FIX: Re-imported CheckCircle (used in Audit Logs StatCard)
    ClipboardList 
} from 'lucide-react';

// Helper to get CR status color
const getStatusColor = (status) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800 border-green-300';
        case 'Rejected': return 'bg-red-100 text-red-800 border-red-300';
        case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

// Helper for audit logs action color
const getActionColor = (action) => {
    const colors = {
        'CR Created': 'bg-blue-100 text-blue-800 border-blue-300',
        'CR Submitted': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'CR Approved': 'bg-green-100 text-green-800 border-green-300',
        'CR Rejected': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[action] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// Reusable Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, border = false }) => {
    const colorClasses = {
        blue: 'border-blue-400 text-blue-600',
        green: 'border-green-400 text-green-600',
        purple: 'border-purple-400 text-purple-600',
        yellow: 'border-yellow-400 text-yellow-600',
    };
    const finalBorderClass = border ? `border-l-4 ${colorClasses[color]}` : `border-b-4 ${colorClasses[color]}`;

    return (
        <div className={`bg-white overflow-hidden shadow-xl rounded-xl ${finalBorderClass} p-6`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-4xl font-extrabold text-gray-900 mt-2">{value}</p>
                </div>
                <Icon className={colorClasses[color]} size={48} />
            </div>
        </div>
    );
};

// Reusable Summary Card Component
const SummaryCard = ({ title, children }) => (
    <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

// User Creation/Editing Modal Component
const UserModal = ({ show, onClose, mode, userForm, setUserForm, onSubmit, loading }) => {
    if (!show) return null;

    const modalTitle = mode === 'create' ? 'Create New User' : `Edit User: ${userForm.email}`;
    const submitButtonText = mode === 'create' ? 'Create User' : 'Save Changes';
    const isEditMode = mode === 'edit';

    const handleFormChange = (e) => {
        setUserForm({ ...userForm, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                    {modalTitle}
                                </h3>
                                <form onSubmit={onSubmit} className="mt-4 space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            required
                                            value={userForm.email}
                                            onChange={handleFormChange}
                                            disabled={isEditMode}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password {isEditMode ? '(Leave blank to keep current)' : '*'}
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            id="password"
                                            required={!isEditMode}
                                            value={userForm.password}
                                            onChange={handleFormChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role *</label>
                                        <select
                                            name="role"
                                            id="role"
                                            required
                                            value={userForm.role}
                                            onChange={handleFormChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        >
                                            <option>Developer</option>
                                            <option>Reviewer</option>
                                            <option>Admin</option>
                                            <option>System Administrator</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : submitButtonText}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); 

    const [statistics, setStatistics] = useState(null);
    const [users, setUsers] = useState([]);
    const [allCRs, setAllCRs] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); 

    const [showUserModal, setShowUserModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userForm, setUserForm] = useState({ email: '', password: '', role: 'Developer' });
    const [formLoading, setFormLoading] = useState(false);

    const generateAuditLogs = useCallback((changeRequests) => {
        const logs = [];
        
        changeRequests.forEach(cr => {
            logs.push({
                _id: `${cr._id}-created`, action: 'CR Created', crNumber: cr.cr_number, crTitle: cr.title,
                user: cr.createdBy?.email || 'Unknown', timestamp: cr.createdAt, details: `Created ${cr.category || 'N/A'} change request`
            });
            if (cr.submittedAt) {
                logs.push({
                    _id: `${cr._id}-submitted`, action: 'CR Submitted', crNumber: cr.cr_number, crTitle: cr.title,
                    user: cr.createdBy?.email || 'Unknown', timestamp: cr.submittedAt, details: 'Submitted for review'
                });
            }
            if (cr.status === 'Approved' && cr.reviewedBy) {
                logs.push({
                    _id: `${cr._id}-approved`, action: 'CR Approved', crNumber: cr.cr_number, crTitle: cr.title,
                    user: cr.reviewedBy?.email || 'Reviewer', timestamp: cr.reviewedAt || cr.updatedAt, details: cr.reviewComments || 'Approved'
                });
            }
            if (cr.status === 'Rejected' && cr.reviewedBy) {
                logs.push({
                    _id: `${cr._id}-rejected`, action: 'CR Rejected', crNumber: cr.cr_number, crTitle: cr.title,
                    user: cr.reviewedBy?.email || 'Reviewer', timestamp: cr.reviewedAt || cr.updatedAt, details: cr.reviewComments || 'Rejected'
                });
            }
        });

        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAuditLogs(logs);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, crsRes] = await Promise.all([
                adminAPI.getStatistics().catch(e => { console.error("Stats fetch failed:", e); return null; }),
                adminAPI.getAllUsers().catch(e => { console.error("Users fetch failed:", e); return null; }),
                adminAPI.getAllCRs().catch(e => { console.error("CRs fetch failed:", e); return null; }),
            ]);
            
            if (statsRes) setStatistics(statsRes);
            if (usersRes) setUsers(usersRes.users || []);
            
            const allChangeRequests = crsRes?.changeRequests || [];
            setAllCRs(allChangeRequests);
            
            generateAuditLogs(allChangeRequests);
            
            setError('');
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
            setError('Failed to load admin data. Please check your connection or server status.');
        } finally {
            setLoading(false);
        }
    }, [generateAuditLogs]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!['Admin', 'System Administrator'].includes(user.role)) {
            navigate('/dashboard', { replace: true }); 
            return;
        }
        console.log('AdminDashboard mounted, fetching data...');
        fetchData(); 
    }, [user, navigate, fetchData]); 

    // Removed handleReviewCR function

    const openCreateUserModal = () => {
        setModalMode('create');
        setUserForm({ email: '', password: '', role: 'Developer' }); 
        setSelectedUser(null);
        setShowUserModal(true);
    };

    const openEditUserModal = (user) => {
        setModalMode('edit');
        setUserForm({ email: user.email, password: '', role: user.role }); 
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const closeUserModal = () => {
        setShowUserModal(false);
        setSelectedUser(null);
        setUserForm({ email: '', password: '', role: 'Developer' });
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        
        if (modalMode === 'create' && (!userForm.email || !userForm.password || !userForm.role)) {
             alert('Email, password, and role are required for a new user.');
             setFormLoading(false);
             return;
        }

        try {
            if (modalMode === 'create') {
                await adminAPI.createUser(userForm);
                alert('User created successfully!');
            } else {
                const updateData = { email: userForm.email, role: userForm.role };
                if (userForm.password) {
                    updateData.password = userForm.password;
                }
                await adminAPI.updateUser(selectedUser._id, updateData);
                alert('User updated successfully!');
            }
            
            await fetchData();
            closeUserModal();
        } catch (err) {
            console.error('Failed to save user:', err);
            alert(err.response?.data?.error || err.message || 'Failed to save user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (userId === user.id) { 
            alert("You cannot delete your own account.");
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        
        try {
            await adminAPI.deleteUser(userId);
            alert('User deleted successfully!');
            await fetchData();
        } catch (err) {
            console.error('Failed to delete user:', err);
            alert(err.response?.data?.message || err.message || 'Failed to delete user');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    // Define the list of tabs *without* 'review'
    const tabsConfig = [
        'overview', 
        'users', 
        'crs', 
        'audit'
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                            <Shield className="text-blue-600" size={32} />
                            Admin Dashboard
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Welcome, <span className="font-semibold text-blue-600">{user?.email || 'Admin'}</span> | Role: {user?.role || 'N/A'}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-red-700 border border-red-300 bg-red-100 hover:bg-red-200 rounded-lg transition shadow-sm"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                
                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="flex gap-4 overflow-x-auto">
                        {/* ITERATE OVER THE tabsConfig ARRAY */}
                        {tabsConfig.map(tab => {
                            const icons = { overview: Activity, users: Users, crs: FileText, audit: ClipboardList };
                            const TabIcon = icons[tab];
                            const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                            
                            let tabLabel = label;
                            if (label === 'Crs') tabLabel = 'All Change Requests';
                            if (label === 'Users') tabLabel = 'User Management';
                            if (label === 'Audit') tabLabel = 'Audit Logs';
                            
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center px-4 py-2 font-medium border-b-2 whitespace-nowrap transition ${
                                        activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <TabIcon className="mr-2" size={18} />
                                    {tabLabel}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {error && (
                    <div className="mb-6 bg-red-100 border border-red-400 rounded-lg p-4">
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                )}

                {/* --- Overview Tab --- */}
                {activeTab === 'overview' && statistics && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">System Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard title="Total Users" value={statistics.users.total} icon={Users} color="blue" />
                            <StatCard title="Total CRs" value={statistics.changeRequests.total} icon={FileText} color="green" />
                            {/* Display Pending CRs from statistics data */}
                            <StatCard 
                                title="Pending CRs" 
                                value={statistics.changeRequests.byStatus.find(s => s._id === 'Pending')?.count || 0} 
                                icon={TrendingUp} 
                                color="purple" 
                            />
                            <StatCard 
                                title="Approved CRs" 
                                value={statistics.changeRequests.byStatus.find(s => s._id === 'Approved')?.count || 0} 
                                icon={Shield} 
                                color="yellow" 
                            />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <SummaryCard title="Users by Role">
                                {statistics.users.byRole.map(role => (
                                    <div key={role._id} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{role._id}</span>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                            {role.count}
                                        </span>
                                    </div>
                                ))}
                            </SummaryCard>
                            <SummaryCard title="CRs by Status">
                                {statistics.changeRequests.byStatus.map(status => (
                                    <div key={status._id} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{status._id}</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(status._id)}`}>
                                            {status.count}
                                        </span>
                                    </div>
                                ))}
                            </SummaryCard>
                        </div>
                    </div>
                )}

                {/* --- User Management Tab --- */}
                {activeTab === 'users' && (
                    <div>
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">User Management ({users.length} Total)</h2>
                            <button
                                onClick={openCreateUserModal}
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg font-medium flex items-center gap-2"
                            >
                                <UserPlus size={20} /> Create New User
                            </button>
                        </div>

                        <div className="bg-white shadow-lg overflow-x-auto rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created At</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-blue-50 transition">
                                            <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditUserModal(u)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><Edit size={16} />Edit</button>
                                                    <button onClick={() => handleDeleteUser(u._id)} disabled={u._id === user?.id} className="text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={16} />Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- All CRs Tab --- */}
                {activeTab === 'crs' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">All Change Requests ({allCRs.length} Total)</h2>
                        <div className="bg-white shadow-lg overflow-x-auto rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CR Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created By</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created At</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {allCRs.map((cr) => (
                                        <tr key={cr._id} className="hover:bg-blue-50 transition">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{cr.cr_number}</td>
                                            <td className="px-6 py-4 text-sm text-gray-800 truncate max-w-xs">{cr.title}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(cr.status)}`}>
                                                    {cr.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                                                    {cr.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{cr.createdBy?.email || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(cr.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- Audit Logs Tab --- */}
                {activeTab === 'audit' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Audit Logs ({auditLogs.length} Total)</h2>
                            <p className="text-gray-600 mt-1">
                                All system and user actions are displayed here, sorted by most recent.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard title="Total Actions" value={auditLogs.length} icon={ClipboardList} color="blue" border={true}/>
                            <StatCard title="CRs Created" value={auditLogs.filter(log => log.action === 'CR Created').length} icon={FileText} color="green" border={true}/>
                            {/* The StatCard that previously caused the error (now fixed) */}
                            <StatCard title="Reviews Done" value={auditLogs.filter(log => ['CR Approved', 'CR Rejected'].includes(log.action)).length} icon={CheckCircle} color="yellow" border={true}/>
                        </div>

                        <div className="bg-white shadow-lg overflow-x-auto rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CR</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {auditLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{log.crNumber || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{log.user}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-sm truncate">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {showUserModal && (
                <UserModal
                    show={showUserModal}
                    onClose={closeUserModal}
                    mode={modalMode}
                    userForm={userForm}
                    setUserForm={setUserForm}
                    onSubmit={handleUserSubmit}
                    loading={formLoading}
                />
            )}
        </div>
    );
}