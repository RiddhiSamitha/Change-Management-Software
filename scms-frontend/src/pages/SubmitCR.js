// src/pages/SubmitCR.js
// Implements SE-8: Submit Draft Change Request

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crAPI } from '../config/api'; 

export default function SubmitCR() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Normal',
    priority: 'Medium',
    impact_scope: '',
    attachments: '' // <-- NEW FIELD FOR SE-8
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // SE-8: Required fields validated
    if (!formData.title || formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 500) {
      newErrors.title = 'Title must not exceed 500 characters';
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
    
    setLoading(true);
    try {
      // This function now calls your MERN backend with all form data
      await crAPI.create(formData); 
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Failed to submit CR. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Submit Change Request</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new change request for review and approval
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                ✓ Change request submitted successfully! Redirecting to dashboard...
              </p>
            </div>
          )}

          {errors.submit && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
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
                  errors.title
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm sm:text-sm`}
                placeholder="Brief summary of the change (10-500 characters)"
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.title.length}/500 characters
              </p>
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
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
                  errors.description
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } rounded-md shadow-sm sm:text-sm`}
                placeholder="Detailed description of the change request, including purpose, scope, and expected outcomes..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Category and Priority */}
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="Normal">Normal</option>
                  <option value="Standard">Standard</option>
                  <option value="Emergency">Emergency</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.category === 'Emergency' && 'Requires immediate implementation'}
                  {formData.category === 'Standard' && 'Pre-approved change type'}
                  {formData.category === 'Normal' && 'Standard approval workflow'}
                </p>
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Impact Scope */}
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Frontend, Backend, Database, API, Authentication"
              />
              <p className="mt-1 text-xs text-gray-500">
                Specify which parts of the system will be affected by this change
              </p>
            </div>
            
            {/* --- NEW ATTACHMENTS FIELD --- */}
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., http://link-to-your-design-doc-or-screenshot.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Link to any relevant documents, mockups, or logs.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Change Request'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 justify-center py-3 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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