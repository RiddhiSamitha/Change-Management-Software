import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, crAPI } from '../config/api';
import { Users, FileText, TrendingUp, UserPlus, Edit, Trash2, Shield, Activity, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [statistics, setStatistics] = useState(null);
    const [users, setUsers] = useState([]);
    const [allCRs, setAllCRs] = useState([]);
    const [pendingCRs, setPendingCRs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // overview, users, crs, review

    // User modal state
    const [showUserModal, setShowUserModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userForm, setUserForm] = useState({ email: '', password: '', role: 'Developer' });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!['Admin', 'System Administrator'].includes(user.role)) {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, crsRes] = await Promise.all([
                adminAPI.getStatistics(),
                adminAPI.getAllUsers(),
                adminAPI.getAllCRs()
            ]);
            
            setStatistics(statsRes);
            setUsers(usersRes.users || []);
            setAllCRs(crsRes.changeRequests || []);
            
            // Filter pending CRs for review dashboard
            const pending = (crsRes.changeRequests || []).filter(cr => cr.status === 'Pending');
            setPendingCRs(pending);
            
            setError('');
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
            setError('Failed to load admin data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewCR = async (crId, action, comments = '') => {
        try {
            if (action === 'approve') {
                await crAPI.approve(crId, comments);
            } else {
                await crAPI.reject(crId, comments);
            }
            await fetchData();
            alert(`Change request ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        } catch (err) {
            console.error('Failed to review CR:', err);
            alert(err.response?.data?.message || 'Failed to review change request');
        }
    };

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
        
        try {
            if (modalMode === 'create') {
                await adminAPI.createUser(userForm);
            } else {
                await adminAPI.updateUser(selectedUser._id, userForm);
            }
            
            await fetchData();
            closeUserModal();
        } catch (err) {
            console.error('Failed to save user:', err);
            alert(err.response?.data?.error || 'Failed to save user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        
        try {
            await adminAPI.deleteUser(userId);
            await fetchData();
        } catch (err) {
            console.error('Failed to delete user:', err);
            alert(err.response?.data?.message || 'Failed to delete user');
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

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                            <Shield className="text-blue-600" size={32} />
                            Admin Dashboard
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Welcome, <span className="font-semibold text-blue-600">{user?.email}</span> | Role: {user?.role}
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

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 font-medium border-b-2 transition ${
                                activeTab === 'overview'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Activity className="inline mr-2" size={18} />
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('review')}
                            className={`px-4 py-2 font-medium border-b-2 transition ${
                                activeTab === 'review'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <CheckCircle className="inline mr-2" size={18} />
                            Review Dashboard
                            {pendingCRs.length > 0 && (
                                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                    {pendingCRs.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 font-medium border-b-2 transition ${
                                activeTab === 'users'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Users className="inline mr-2" size={18} />
                            User Management
                        </button>
                        <button
                            onClick={() => setActiveTab('crs')}
                            className={`px-4 py-2 font-medium border-b-2 transition ${
                                activeTab === 'crs'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <FileText className="inline mr-2" size={18} />
                            All Change Requests
                        </button>
                    </nav>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-100 border border-red-400 rounded-lg p-4">
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && statistics && (
                    <div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white overflow-hidden shadow-xl rounded-xl border-b-4 border-blue-400 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                                        <p className="text-4xl font-extrabold text-gray-900 mt-2">{statistics.users.total}</p>
                                    </div>
                                    <Users className="text-blue-600" size={48} />
                                </div>
                            </div>
                            <div className="bg-white overflow-hidden shadow-xl rounded-xl border-b-4 border-green-400 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total CRs</p>
                                        <p className="text-4xl font-extrabold text-gray-900 mt-2">{statistics.changeRequests.total}</p>
                                    </div>
                                    <FileText className="text-green-600" size={48} />
                                </div>
                            </div>
                            <div className="bg-white overflow-hidden shadow-xl rounded-xl border-b-4 border-purple-400 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Pending CRs</p>
                                        <p className="text-4xl font-extrabold text-gray-900 mt-2">
                                            {statistics.changeRequests.byStatus.find(s => s._id === 'Pending')?.count || 0}
                                        </p>
                                    </div>
                                    <TrendingUp className="text-purple-600" size={48} />
                                </div>
                            </div>
                            <div className="bg-white overflow-hidden shadow-xl rounded-xl border-b-4 border-yellow-400 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Approved CRs</p>
                                        <p className="text-4xl font-extrabold text-gray-900 mt-2">
                                            {statistics.changeRequests.byStatus.find(s => s._id === 'Approved')?.count || 0}
                                        </p>
                                    </div>
                                    <Shield className="text-yellow-600" size={48} />
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Users by Role */}
                            <div className="bg-white shadow-lg rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Users by Role</h3>
                                <div className="space-y-3">
                                    {statistics.users.byRole.map(role => (
                                        <div key={role._id} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">{role._id}</span>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                                {role.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CRs by Status */}
                            <div className="bg-white shadow-lg rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">CRs by Status</h3>
                                <div className="space-y-3">
                                    {statistics.changeRequests.byStatus.map(status => (
                                        <div key={status._id} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">{status._id}</span>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                                                {status.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Dashboard Tab */}
                {activeTab === 'review' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Review Dashboard</h2>
                            <p className="text-gray-600 mt-1">
                                Review and approve/reject pending change requests
                            </p>
                        </div>

                        {pendingCRs.length === 0 ? (
                            <div className="bg-white shadow-lg rounded-xl p-12 text-center">
                                <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                                <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
                                <p className="text-gray-600">No pending change requests to review at the moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingCRs.map((cr) => (
                                    <div key={cr._id} className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-yellow-400">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900">{cr.title}</h3>
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                                                        {cr.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">{cr.description}</p>
                                                
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500 font-medium">CR Number:</span>
                                                        <p className="text-gray-900 font-semibold">{cr.cr_number}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 font-medium">Category:</span>
                                                        <p className="text-gray-900">{cr.category}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 font-medium">Priority:</span>
                                                        <p className="text-gray-900">{cr.priority}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 font-medium">Created By:</span>
                                                        <p className="text-gray-900">{cr.createdBy?.email || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    const comments = prompt('Add review comments (optional):');
                                                    if (comments !== null) {
                                                        handleReviewCR(cr._id, 'reject', comments);
                                                    }
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition flex items-center gap-2"
                                            >
                                                <XCircle size={16} />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const comments = prompt('Add review comments (optional):');
                                                    if (comments !== null) {
                                                        handleReviewCR(cr._id, 'approve', comments);
                                                    }
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center gap-2"
                                            >
                                                <CheckCircle size={16} />
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* User Management Tab */}
                {activeTab === 'users' && (
                    <div>
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                            <button
                                onClick={openCreateUserModal}
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg font-medium flex items-center gap-2"
                            >
                                <UserPlus size={20} />
                                Create New User
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
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditUserModal(u)}
                                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                    >
                                                        <Edit size={16} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id)}
                                                        disabled={u._id === user.id}
                                                        className="text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* All CRs Tab */}
                {activeTab === 'crs' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">All Change Requests</h2>
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
                                                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
                                                    {cr.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                                                    {cr.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{cr.createdBy?.email || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(cr.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            {modalMode === 'create' ? 'Create New User' : 'Edit User'}
                        </h3>
                        
                        <form onSubmit={handleUserSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password {modalMode === 'edit' && '(leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    required={modalMode === 'create'}
                                    minLength={8}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Developer">Developer</option>
                                    <option value="Reviewer">Reviewer</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={closeUserModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                                >
                                    {formLoading ? 'Saving...' : modalMode === 'create' ? 'Create User' : 'Update User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}