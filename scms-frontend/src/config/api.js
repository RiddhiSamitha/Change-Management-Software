import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// --- Create axios instance ---
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// --- Request Interceptor: attach JWT token if available ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor: handle global errors ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =================================================================
// ✅ AUTHENTICATION API
// Matches backend: app.use('/api/auth', require('./routes/auth'))
// =================================================================
export const authAPI = {
  register: async (email, password, role = 'Developer') => {
    const response = await api.post('/api/auth/register', { email, password, role });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    // Client-side logout only
    return Promise.resolve({ message: "Logout successful" });
  },
};

// =================================================================
// ✅ CHANGE REQUEST API
// Matches backend: app.use('/api/change-requests', require('./routes/changeRequests'))
// =================================================================
export const crAPI = {
  getAll: async () => {
    const response = await api.get('/api/change-requests');
    return response.data;
  },

  create: async (formData) => {
    const response = await api.post('/api/change-requests', formData);
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/api/change-requests/${id}`);
    return response.data;
  },

  update: async (id, formData) => {
    const response = await api.put(`/api/change-requests/${id}`, formData);
    return response.data;
  },

  submitForApproval: async (id) => {
    const response = await api.put(`/api/change-requests/${id}/submit`);
    return response.data;
  },

  approve: async (id, comment) => {
    const response = await api.put(`/api/change-requests/${id}/approve`, {
      comment: comment || 'Approved',
    });
    return response.data;
  },

  reject: async (id, comment) => {
    const response = await api.put(`/api/change-requests/${id}/reject`, {
      comment: comment || 'Rejected',
      reason: comment || 'Rejected',
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/change-requests/${id}`);
    return response.data;
  },

  addComment: async (id, comment) => {
    const response = await api.post(`/api/change-requests/${id}/comments`, { comment });
    return response.data;
  },

  getComments: async (id) => {
    const response = await api.get(`/api/change-requests/${id}/comments`);
    return response.data;
  },
};

// =================================================================
// ✅ ADMIN API
// Matches backend: app.use('/api/admin', require('./routes/admin'))
// =================================================================
export const adminAPI = {
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

  getStatistics: async () => {
    const response = await api.get('/api/admin/statistics');
    return response.data;
  },

  getAllCRs: async () => {
    const response = await api.get('/api/admin/change-requests');
    return response.data;
  },
};

export default api;