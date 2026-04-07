import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';

const Topbar = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="topbar d-flex align-items-center justify-content-between">
      <div className="fw-semibold text-muted" style={{ fontSize: '0.9rem' }}>
        <i className="bi bi-geo-alt-fill me-1 text-success"></i>
        {t('ashaPortal')} — {t('adminPortal')}
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

        {/* Language Dropdown */}
        <div className="dropdown">
          <button 
            className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1" 
            data-bs-toggle="dropdown"
            onClick={() => setShowLangDropdown(!showLangDropdown)}
          >
            <span style={{ fontSize: '0.75rem', width: 16, height: 16, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🌐
            </span>
            {LANGUAGES.find(l => l.code === language)?.label?.slice(0, 3)}
          </button>
          <ul className="dropdown-menu dropdown-menu-end" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {LANGUAGES.slice(0, 10).map(lang => (  // Top 10 for space
              <li key={lang.code}>
                <button 
                  className="dropdown-item d-flex align-items-center gap-2" 
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangDropdown(false);
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              </li>
            ))}
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-muted small" onClick={() => navigate('/parent/settings')}>
                {t('settings')} → Full list
              </button>
            </li>
          </ul>
        </div>

        {/* User dropdown */}
        <div className="dropdown">
          <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
            <i className="bi bi-person-circle me-1"></i>
            {user?.name}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <span className="dropdown-item-text text-muted small">
                {t('role')}: <strong className="text-capitalize">{user?.role}</strong>
              </span>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={logout}>
                <i className="bi bi-box-arrow-right me-2"></i>{t('logout')}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
