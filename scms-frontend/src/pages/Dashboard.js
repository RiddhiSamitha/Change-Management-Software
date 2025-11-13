import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { crAPI } from '../config/api'; 
import { FileUp, Eye, Trash2, Edit3 } from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [crs, setCRs] = useState([]);
    const [filteredCRs, setFilteredCRs] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingCrId, setLoadingCrId] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
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
            const response = await crAPI.getAll(); 
            const changeRequests = response?.changeRequests || [];
            setCRs(changeRequests);
            setFilteredCRs(changeRequests);
            setError('');
        } catch (err) {
            console.error('Failed to fetch CRs:', err);
            setError('Could not connect to CR service. Is the scms-api server running?');
            setCRs([]);
            setFilteredCRs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitForApproval = async (crId) => {
        setLoadingCrId(crId);
        setError('');
        try {
            const updatedCR = await crAPI.submitForApproval(crId);
            setCRs(prevCRs => 
                prevCRs.map(cr => 
                    cr._id === crId ? { ...cr, status: updatedCR.status, submittedAt: updatedCR.submittedAt } : cr
                )
            );
        } catch (err) {
            console.error('Failed to submit CR:', err);
            setError(err.response?.data?.message || 'Failed to submit for approval.');
        } finally {
            setLoadingCrId(null);
        }
    };

    const handleDelete = async (crId) => {
        setLoadingCrId(crId);
        setError('');
        try {
            await crAPI.delete(crId);
            setCRs(prevCRs => prevCRs.filter(cr => cr._id !== crId));
        } catch (err) {
            console.error('Failed to delete CR:', err);
            setError(err.response?.data?.message || 'Failed to delete CR.');
        } finally {
            setLoadingCrId(null);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Draft: 'bg-gray-100 text-gray-800 border-gray-300',
            Pending: 'bg-yellow-100 text-yellow-800 border-yellow-400',
            Approved: 'bg-green-100 text-green-800 border-green-400',
            Rejected: 'bg-red-100 text-red-800 border-red-400',
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

    // --- Stats grid ---
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

    const renderActions = (cr) => {
        const isDraft = cr.status === 'Draft';
        const isLoading = loadingCrId === cr._id;

        if (isDraft) {
            return (
                <>
                    <button 
                        onClick={() => handleSubmitForApproval(cr._id)}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-wait"
                    >
                        <FileUp size={14} />
                        {isLoading ? 'Submitting...' : 'Submit'}
                    </button>
                    <button 
                        onClick={() => navigate(`/cr/edit/${cr._id}`)}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    >
                        <Edit3 size={14} />
                        Edit
                    </button>
                    <button 
                        onClick={() => handleDelete(cr._id)}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-wait"
                    >
                        <Trash2 size={14} />
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </>
            );
        }

        return (
            <button 
                onClick={() => navigate(`/cr/view/${cr._id}`)}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
                <Eye size={14} />
                View
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">SCMS Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Welcome back, <span className="font-semibold text-blue-600">{user?.email || 'User'}</span> | Role: {user?.role || 'Developer'}
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
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 mb-8">
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
                            <dt className="text-sm font-medium text-gray-500 truncate">Rejected/Closed</dt>
                            <dd className="mt-1 text-4xl font-extrabold text-red-600">{rejectedCount}</dd>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-6">
                    Change Request Log ({filteredCRs.length} items)
                </h2>

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <button
                        onClick={() => navigate('/submit-cr')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Submit New CR
                    </button>

                    <div className="flex items-center gap-2">
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
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected/Closed">Rejected</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-100 border border-red-400 rounded-lg p-4">
                        <p className="text-red-800 font-medium">Warning: {error}</p>
                    </div>
                )}

                {filteredCRs.length === 0 && !loading ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No Change Requests Found</h3>
                        <p className="mt-1 text-gray-500">Get started by submitting your first change request.</p>
                    </div>
                ) : (
                    <div className="bg-white shadow-lg overflow-x-auto rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%]">CR Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[30%]">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[15%]">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%]">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[15%]">Last Updated</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%]">Created By</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCRs.map((cr) => (
                                    <tr key={cr._id} className="hover:bg-blue-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cr.cr_number}</td>
                                        <td className="px-6 py-4 text-sm text-gray-800 truncate" title={cr.title}>{cr.title}</td>
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
                                            {new Date(cr.updatedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={cr.createdBy?.email}>
                                            {cr.createdBy?.email || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                {renderActions(cr)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
