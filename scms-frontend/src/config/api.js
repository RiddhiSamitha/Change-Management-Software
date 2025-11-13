import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Return a rejected promise with the error
    return Promise.reject(error);
  }
);

// --- API ENDPOINTS ---

// 1. Authentication API
export const authAPI = {
  register: async (email, password, role = 'Developer') => {
    const response = await api.post('/register', { email, password, role });
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },
  logout: async () => {
    // No backend route, just resolve client-side
    return Promise.resolve({ message: "Logout successful" });
  }
};

// 2. Change Request (CR) API
export const crAPI = {
    // Get all CRs (filtered by user role on backend)
    getAll: async () => {
        const response = await api.get('/api/change-requests');
        return response.data; 
    },
    
    // Create new CR
    create: async (formData) => {
        const response = await api.post('/api/change-requests', formData);
        return response.data;
    },
    
    // Get single CR by ID
    getOne: async (id) => {
      const response = await api.get(`/api/change-requests/${id}`);
      return response.data; 
    },
    
    // Update existing CR (for Draft status)
    update: async (id, formData) => {
      const response = await api.put(`/api/change-requests/${id}`, formData);
      return response.data;
    },
    
    // Submit CR for approval (Draft -> Pending)
    submitForApproval: async (id) => {
      const response = await api.put(`/api/change-requests/${id}/submit`);
      return response.data;
    },
    
    // Approve CR (Reviewer only) - UPDATED to accept comment
    approve: async (id, comment) => {
      const response = await api.put(`/api/change-requests/${id}/approve`, { 
        comment: comment || 'Approved' 
      });
      return response.data;
    },
    
    // Reject CR (Reviewer only) - UPDATED to accept comment
    reject: async (id, comment) => {
      const response = await api.put(`/api/change-requests/${id}/reject`, { 
        comment: comment || 'Rejected',
        reason: comment || 'Rejected' // Some backends might expect 'reason' instead
      });
      return response.data;
    },
    
    // Delete CR (Draft only)
    delete: async (id) => {
      const response = await api.delete(`/api/change-requests/${id}`);
      return response.data;
    },
    
    // Add comment to CR
    addComment: async (id, comment) => {
      const response = await api.post(`/api/change-requests/${id}/comments`, { 
        comment 
      });
      return response.data;
    },
    
    // Get comments for a CR
    getComments: async (id) => {
      const response = await api.get(`/api/change-requests/${id}/comments`);
      return response.data;
    }
};

// 3. Admin API
export const adminAPI = {
    // User Management
    getAllUsers: async () => {
      const response = await api.get('/api/admin/users');
      return response.data;
    },
    getUser: async (id) => {
      const response = await api.get(`/api/admin/users/${id}`);
      return response.data;
    },
    createUser: async (userData) => {
      const response = await api.post('/api/admin/users', userData);
      return response.data;
    },
    updateUser: async (id, userData) => {
      const response = await api.put(`/api/admin/users/${id}`, userData);
      return response.data;
    },
    deleteUser: async (id) => {
      const response = await api.delete(`/api/admin/users/${id}`);
      return response.data;
    },
    
    // Statistics
    getStatistics: async () => {
      const response = await api.get('/api/admin/statistics');
      return response.data;
    },
    
    // All CRs (Admin view)
    getAllCRs: async () => {
      const response = await api.get('/api/admin/change-requests');
      return response.data;
    }
};

export default api;