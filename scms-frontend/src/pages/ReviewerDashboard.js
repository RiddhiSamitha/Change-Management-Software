import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { crAPI } from '../config/api';
import { Eye, CheckCircle, XCircle, MessageSquare, Clock } from 'lucide-react';

export default function ReviewerDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [crs, setCRs] = useState([]);
    const [filteredCRs, setFilteredCRs] = useState([]);
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    // Modal state for review actions
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedCR, setSelectedCR] = useState(null);
    const [reviewAction, setReviewAction] = useState(''); // 'approve' or 'reject'
    const [reviewComment, setReviewComment] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'Reviewer') {
            navigate('/dashboard');
            return;
        }
        fetchCRs();
    }, [user, navigate]);

    useEffect(() => {
        if (statusFilter === 'All') {
            setFilteredCRs(crs);
        } else {
            setFilteredCRs(crs.filter(cr => cr.status === statusFilter));
        }
    }, [statusFilter, crs]);

    const fetchCRs = async () => {
        setLoading(true);
        try {
            // Fetch all CRs - backend now filters out Draft CRs for reviewers
            const response = await crAPI.getAll();
            const changeRequests = response?.changeRequests || [];
            
            console.log('Fetched CRs for reviewer:', changeRequests.length);
            
            setCRs(changeRequests);
            // Default filter to show Pending CRs first
            setFilteredCRs(changeRequests.filter(cr => cr.status === 'Pending'));
            setError('');
        } catch (err) {
            console.error('Failed to fetch CRs:', err);
            setError('Could not connect to CR service. Please check the server.');
            setCRs([]);
            setFilteredCRs([]);
        } finally {
            setLoading(false);
        }
    };

    const openReviewModal = (cr, action) => {
        setSelectedCR(cr);
        setReviewAction(action);
        setReviewComment('');
        setShowReviewModal(true);
    };

    const closeReviewModal = () => {
        setShowReviewModal(false);
        setSelectedCR(null);
        setReviewAction('');
        setReviewComment('');
    };

    const handleReviewSubmit = async () => {
        if (!reviewComment.trim()) {
            alert('Please provide a comment for your review decision.');
            return;
        }

        setActionLoading(selectedCR._id);
        setError('');

        try {
            if (reviewAction === 'approve') {
                await crAPI.approve(selectedCR._id, reviewComment);
            } else if (reviewAction === 'reject') {
                await crAPI.reject(selectedCR._id, reviewComment);
            }

            // Refresh CRs after action
            await fetchCRs();
            closeReviewModal();
        } catch (err) {
            console.error('Failed to submit review:', err);
            setError(err.response?.data?.message || 'Failed to submit review.');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Draft: 'bg-gray-100 text-gray-800 border-gray-300',
            Pending: 'bg-yellow-100 text-yellow-800 border-yellow-400',
            Approved: 'bg-green-100 text-green-800 border-green-400',
            Rejected: 'bg-red-100 text-red-800 border-red-400',
            'In Progress': 'bg-blue-100 text-blue-800 border-blue-400',
            Closed: 'bg-gray-300 text-gray-900 border-gray-400'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getCategoryColor = (category) => {
        const colors = {
            Emergency: 'bg-red-100 text-red-800 border-red-500',
            Standard: 'bg-indigo-100 text-indigo-800 border-indigo-500',
            Normal: 'bg-green-100 text-green-800 border-green-500'
        };
        return colors[category] || 'bg-gray-100 text-gray-800 border-gray-500';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Stats
    const totalCount = crs.length;
    const pendingCount = crs.filter(cr => cr.status === 'Pending').length;
    const approvedCount = crs.filter(cr => cr.status === 'Approved').length;
    const rejectedCount = crs.filter(cr => cr.status === 'Rejected').length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Change Requests...</p>
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
                        <h1 className="text-3xl font-extrabold text-gray-900">Reviewer Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Welcome, <span className="font-semibold text-blue-600">{user?.email || 'User'}</span> | Role: {user?.role || 'Reviewer'}
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
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4 mb-8">
                    <div className="bg-white overflow-hidden shadow-xl rounded-xl border-b-4 border-gray-300">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total CRs</dt>
                            <dd className="mt-1 text-4xl font-extrabold text-gray-900">{totalCount}</dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-xl rounded-xl border-b-4 border-yellow-400">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                            <dd className="mt-1 text-4xl font-extrabold text-yellow-600">{pendingCount}</dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-xl rounded-xl border-b-4 border-green-400">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                            <dd className="mt-1 text-4xl font-extrabold text-green-600">{approvedCount}</dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-xl rounded-xl border-b-4 border-red-400">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                            <dd className="mt-1 text-4xl font-extrabold text-red-600">{rejectedCount}</dd>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-6">
                    Change Requests for Review ({filteredCRs.length} items)
                </h2>

                {/* Filters */}
                <div className="mb-6 flex items-center gap-2">
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                        Filter by Status:
                    </label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-100 border border-red-400 rounded-lg p-4">
                        <p className="text-red-800 font-medium">Error: {error}</p>
                    </div>
                )}

                {/* CR Table */}
                {filteredCRs.length === 0 && !loading ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                        <Clock className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No Change Requests Found</h3>
                        <p className="mt-1 text-gray-500">
                            {statusFilter === 'Pending' 
                                ? 'No CRs are currently pending your review.' 
                                : `No CRs with status "${statusFilter}".`}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white shadow-lg overflow-x-auto rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">CR Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCRs.map((cr) => (
                                    <tr key={cr._id} className="hover:bg-blue-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cr.cr_number}</td>
                                        <td className="px-6 py-4 text-sm text-gray-800 truncate max-w-xs" title={cr.title}>{cr.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getCategoryColor(cr.category)}`}>
                                                {cr.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(cr.status)}`}>
                                                {cr.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {cr.submittedAt ? new Date(cr.submittedAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={cr.createdBy?.email}>
                                            {cr.createdBy?.email || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => navigate(`/cr/view/${cr._id}`)}
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </button>
                                                {cr.status === 'Pending' && (
                                                    <>
                                                        <button 
                                                            onClick={() => openReviewModal(cr, 'approve')}
                                                            disabled={actionLoading === cr._id}
                                                            className="flex items-center gap-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={16} />
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => openReviewModal(cr, 'reject')}
                                                            disabled={actionLoading === cr._id}
                                                            className="flex items-center gap-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={16} />
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Change Request
                            </h3>
                            <button onClick={closeReviewModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">CR Number: <span className="font-semibold">{selectedCR?.cr_number}</span></p>
                            <p className="text-sm text-gray-600 mt-1">Title: <span className="font-semibold">{selectedCR?.title}</span></p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Review Comment <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                rows="4"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Provide your reason for ${reviewAction === 'approve' ? 'approving' : 'rejecting'} this CR...`}
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeReviewModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReviewSubmit}
                                disabled={!reviewComment.trim() || actionLoading}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                    reviewAction === 'approve' 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {actionLoading ? 'Processing...' : `Confirm ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}