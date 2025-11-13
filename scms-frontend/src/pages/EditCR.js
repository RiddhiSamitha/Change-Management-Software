// ============================================
// EditCR.js - FIXED VERSION
// ============================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crAPI } from '../config/api'; 
import { useAuth } from '../context/AuthContext';

export default function EditCR() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Normal',
    priority: 'Medium',
    impact_scope: '',
    attachments: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCR = async () => {
      setLoading(true);
      try {
        const response = await crAPI.getOne(id);
        const cr = response.changeRequest;

        // Security check
        if (!cr.createdBy || cr.createdBy._id !== user?.id || cr.status !== 'Draft') {
            setErrors({ submit: 'You do not have permission to edit this Change Request.' });
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
        }

        setFormData({
            title: cr.title || '',
            description: cr.description || '',
            category: cr.category || 'Normal',
            priority: cr.priority || 'Medium',
            impact_scope: cr.impact_scope || '',
            attachments: cr.attachments?.[0] || ''
        });
      } catch (err) {
        console.error('Error fetching CR:', err);
        if (err.response?.status === 404) {
          setErrors({ submit: 'Change Request not found. It may have been deleted.' });
        } else if (err.response?.status === 403) {
          setErrors({ submit: 'You do not have permission to edit this Change Request.' });
        } else {
          setErrors({ submit: 'Failed to load CR data. Please try again.' });
        }
        setTimeout(() => navigate('/dashboard'), 2000);
      } finally {
        setLoading(false);
      }
    };
    fetchCR();
  }, [id, user?.id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title || formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }
    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitLoading(true);
    try {
      await crAPI.update(id, formData); 
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Failed to update CR. Please try again.'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Change Request</h1>
          <p className="mt-1 text-sm text-gray-600">Update your 'Draft' change request before submission.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                ✓ Change request updated successfully! Redirecting to dashboard...
              </p>
            </div>
          )}
          
          {errors.submit && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm sm:text-sm`}
                placeholder="Brief summary of the change (10-500 characters)"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                id="description"
                rows={6}
                value={formData.description}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm sm:text-sm`}
                placeholder="Detailed description..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  id="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                >
                  <option value="Normal">Normal</option>
                  <option value="Standard">Standard</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  name="priority"
                  id="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="impact_scope" className="block text-sm font-medium text-gray-700">
                Impact Scope
              </label>
              <input
                type="text"
                name="impact_scope"
                id="impact_scope"
                value={formData.impact_scope}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                placeholder="e.g., Frontend, Backend, Database"
              />
            </div>
            
            <div>
              <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">
                Attachment URL (Optional)
              </label>
              <input
                type="text"
                name="attachments"
                id="attachments"
                value={formData.attachments}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                placeholder="http://link-to-document.com"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitLoading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitLoading ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 px-4 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}