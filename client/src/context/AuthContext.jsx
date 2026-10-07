import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sa_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch((err) => {
        // Only drop the session for a rejected token, not for network/server hiccups
        if (err.response?.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
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

  const getDashboardPath = (role) => {
    const paths = { parent: '/parent/dashboard', asha: '/asha/dashboard', admin: '/admin/dashboard' };
    return paths[role] || '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
