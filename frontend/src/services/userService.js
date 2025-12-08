import api from './api';

// Get user profile
export const getProfile = async () => {
  return await api.get('/users/profile');
};

// Update user profile
export const updateProfile = async (userData) => {
  return await api.put('/users/profile', userData);
};

// Get user by ID
export const getUserById = async (userId) => {
  return await api.get(`/users/${userId}`);
};

// Delete account
export const deleteAccount = async () => {
  return await api.delete('/users/profile');
};
