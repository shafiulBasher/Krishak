import api from './api';

// Register user
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  if (response.data && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response;
};

// Login user
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response;
};

// Get current user
export const getCurrentUser = async () => {
  return await api.get('/auth/me');
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Google OAuth
export const googleAuth = async (googleData) => {
  const response = await api.post('/auth/google', googleData);
  if (response.data && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response;
};
