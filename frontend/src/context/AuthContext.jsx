import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, register as registerService, logout as logoutService, getCurrentUser, googleAuth } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await loginService(credentials);
      setUser(response);
      toast.success('Login successful!');
      return response;
    } catch (error) {
      toast.error(error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerService(userData);
      setUser(response);
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      toast.error(error);
      throw error;
    }
  };

  const logout = () => {
    logoutService();
    setUser(null);
    toast.info('Logged out successfully');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const googleLogin = async (credential) => {
    try {
      const response = await googleAuth({ credential });
      setUser(response);
      
      if (response.needsCompletion) {
        toast.info('Please complete your profile');
      } else {
        toast.success('Login successful!');
      }
      
      return response;
    } catch (error) {
      toast.error(error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    googleLogin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
