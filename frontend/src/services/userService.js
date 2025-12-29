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

// Get all delivery addresses
export const getAddresses = async () => {
  return await api.get('/users/addresses');
};

// Add a new delivery address
export const addAddress = async (addressData) => {
  return await api.post('/users/addresses', addressData);
};

// Update a delivery address
export const updateAddress = async (addressId, addressData) => {
  return await api.put(`/users/addresses/${addressId}`, addressData);
};

// Delete a delivery address
export const deleteAddress = async (addressId) => {
  return await api.delete(`/users/addresses/${addressId}`);
};

// Set default delivery address
export const setDefaultAddress = async (addressId) => {
  return await api.put(`/users/addresses/${addressId}/default`);
};

