import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // Still loading auth state — show nothing (prevents flash redirect)
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f0fdff',
      }}>
        <div style={{
          width: 44, height: 44,
          border: '4px solid #cffafe',
          borderTopColor: '#0891b2',
          borderRadius: '50%',
          animation: 'spin .8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrong role → redirect to their own dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const dashboards = {
      parent: '/parent/dashboard',
      asha:   '/asha/dashboard',
      admin:  '/admin/dashboard',
    };
    return <Navigate to={dashboards[user.role] || '/login'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
