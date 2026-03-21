import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';

const Topbar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="topbar d-flex align-items-center justify-content-between">
      <div className="fw-semibold text-muted" style={{ fontSize: '0.9rem' }}>
        <i className="bi bi-geo-alt-fill me-1 text-success"></i>
        Sishu Arogaya — Government Child Health System
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Notifications bell */}
        <Link
          to={`/${user?.role}/notifications`}
          className="text-secondary position-relative"
          style={{ textDecoration: 'none' }}
        >
          <i className="bi bi-bell fs-5"></i>
        </Link>

        {/* User dropdown */}
        <div className="dropdown">
          <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
            <i className="bi bi-person-circle me-1"></i>
            {user?.name}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <span className="dropdown-item-text text-muted small">
                Role: <strong className="text-capitalize">{user?.role}</strong>
              </span>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={logout}>
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
