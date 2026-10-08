import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // The session lives in an httpOnly cookie that JS can't read; ask the server who we are.
  useEffect(() => {
    localStorage.removeItem('sa_token'); // drop tokens left by the old localStorage scheme
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {}); // server revokes the session + clears the cookie
    setUser(null);
  };

  const getDashboardPath = (role) => {
    const paths = { parent: '/parent/dashboard', asha: '/asha/dashboard', admin: '/admin/dashboard' };
    return paths[role] || '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
