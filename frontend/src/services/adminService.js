import api from './api';

// Dashboard Statistics
export const getDashboardStats = async () => {
  const response = await api.get('/admin/dashboard/stats');
  return response.data;
};

// User Management
export const getAllUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/admin/users${params ? `?${params}` : ''}`);
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const updateUserStatus = async (userId, isActive) => {
  const response = await api.put(`/admin/users/${userId}/status`, { isActive });
  return response.data;
};

export const verifyUser = async (userId, isVerified) => {
  const response = await api.put(`/admin/users/${userId}/verify`, { isVerified });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

// Product Management
export const getAllProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/admin/products${params ? `?${params}` : ''}`);
  return response.data;
};

export const getPendingProducts = async () => {
  const response = await api.get('/admin/products/pending');
  return response.data;
};

export const approveProduct = async (productId, moderationNote = '') => {
  const response = await api.put(`/admin/products/${productId}/approve`, { moderationNote });
  return response.data;
};

export const rejectProduct = async (productId, moderationNote) => {
  const response = await api.put(`/admin/products/${productId}/reject`, { moderationNote });
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/admin/products/${productId}`);
  return response.data;
};

// Legacy product moderation stats
export const getProductStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};
