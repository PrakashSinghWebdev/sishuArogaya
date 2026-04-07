import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoadTimeout(true), 5000);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#f0fdff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: '4px solid #cffafe',
              borderTopColor: '#0891b2',
              borderRadius: '50%',
              animation: 'spin .8s linear infinite',
            }}
          />
          {loadTimeout ? (
            <div style={{ color: '#0f766e', fontSize: 14, fontWeight: 500 }}>
              Still checking your session...
            </div>
          ) : null}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const dashboards = {
      parent: '/parent/dashboard',
      asha: '/asha/dashboard',
      admin: '/admin/dashboard',
    };

    return <Navigate to={dashboards[user.role] || '/login'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
