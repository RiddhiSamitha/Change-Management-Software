// ============================================
// ViewCR.js - FIXED VERSION
// ============================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { crAPI } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Edit, Check, X } from 'lucide-react';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
}
const UserInfo = ({ user, label }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{user?.email || 'N/A'}</dd>
    </div>
);
const DetailItem = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || 'N/A'}</dd>
    </div>
);

export default function ViewCR() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cr, setCr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCR = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await crAPI.getOne(id);
        setCr(response.changeRequest);
      } catch (err) {
        console.error('Error fetching CR:', err);
        // Handle 404 specifically
        if (err.response?.status === 404) {
          setError('Change Request not found. It may have been deleted.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this Change Request.');
        } else {
          setError('Failed to fetch Change Request. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCR();
  }, [id]);

  const handleApprove = async () => {
    if (isSubmitting || !window.confirm('Are you sure you want to approve this request?')) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await crAPI.approve(id);
      setCr(response.updatedCR);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (isSubmitting) return;
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    setIsSubmitting(true);
    setError('');
    try {
      const response = await crAPI.reject(id, reason);
      setCr(response.updatedCR);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = cr && cr.status === 'Draft' && cr.createdBy?._id === user?.id;
  const canApprove = cr && cr.status === 'Pending' && user?.role !== 'Developer'; 

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !cr) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!cr) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{cr.title}</h1>
          <span className="text-lg text-gray-500 font-medium">{cr.cr_number}</span>
        </div>
        {canEdit && (
            <button
                onClick={() => navigate(`/cr/edit/${cr._id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
                <Edit size={16} />
                Edit Draft
            </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
        </div>
      )}

      {canApprove && (
        <div className="bg-white shadow rounded-lg p-4 mb-6 flex items-center justify-between">
            <p className="text-lg font-medium text-gray-900">This request is pending your review.</p>
            <div className="flex gap-4">
                <button 
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                    <X size={16} />
                    Reject
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                    <Check size={16} />
                    Approve
                </button>
            </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Request Details</h3>
          <dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <DetailItem label="Status" value={cr.status} />
            <DetailItem label="Category" value={cr.category} />
            <DetailItem label="Priority" value={cr.priority} />
            <DetailItem label="Impact Scope" value={cr.impact_scope} />
            
            <UserInfo user={cr.createdBy} label="Created By" />
            <DetailItem label="Created At" value={formatDate(cr.createdAt)} />

            {cr.submittedBy && (
                <>
                    <UserInfo user={cr.submittedBy} label="Submitted By" />
                    <DetailItem label="Submitted At" value={formatDate(cr.submittedAt)} />
                </>
            )}

            {cr.status === 'Approved' && cr.approvedBy && (
                <>
                    <UserInfo user={cr.approvedBy} label="Approved By" />
                    <DetailItem label="Approved At" value={formatDate(cr.approvalDate)} />
                </>
            )}

            {cr.status === 'Rejected' && cr.rejectedBy && (
                <>
                    <UserInfo user={cr.rejectedBy} label="Rejected By" />
                    <DetailItem label="Rejected At" value={formatDate(cr.rejectionDate)} />
                    <div className="sm:col-span-2">
                      <DetailItem label="Rejection Reason" value={cr.rejectionReason} />
                    </div>
                </>
            )}

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{cr.description}</dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Attachments</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {cr.attachments && cr.attachments.length > 0 ? (
                  <a href={cr.attachments[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {cr.attachments[0]}
                  </a>
                ) : 'None'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}