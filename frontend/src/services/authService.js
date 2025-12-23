import api from './api';

// Register user
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  // API interceptor returns response.data directly
  const userData_obj = response.data || response;
  if (userData_obj && userData_obj.token) {
    localStorage.setItem('token', userData_obj.token);
    localStorage.setItem('user', JSON.stringify(userData_obj));
  }
  return userData_obj;
};

// Login user
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  // API interceptor returns response.data directly
  const userData_obj = response.data || response;
  if (userData_obj && userData_obj.token) {
    localStorage.setItem('token', userData_obj.token);
    localStorage.setItem('user', JSON.stringify(userData_obj));
  }
  return userData_obj;
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
  // API interceptor returns response.data directly
  const userData_obj = response.data || response;
  if (userData_obj && userData_obj.token) {
    localStorage.setItem('token', userData_obj.token);
    localStorage.setItem('user', JSON.stringify(userData_obj));
  }
  return userData_obj;
};
