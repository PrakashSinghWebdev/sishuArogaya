import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sa_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Login with email + password → returns userId for OTP step
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data; // { userId, message, otp? (dev) }
  };

  // Step 2: Verify OTP → store JWT
  const verifyOTP = async (userId, otp) => {
    const res = await api.post('/auth/verify-otp', { userId, otp });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('sa_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('sa_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  // Redirect path based on role
  const getDashboardPath = (role) => {
    const paths = { parent: '/parent/dashboard', asha: '/asha/dashboard', admin: '/admin/dashboard' };
    return paths[role] || '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, verifyOTP, logout, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
