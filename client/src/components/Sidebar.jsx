import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const role = user?.role || 'parent';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NAV_LINKS = {
    parent: [
      { to: '/parent/dashboard',   icon: 'bi-house-door',      label: t('dashboard') },
      { to: '/parent/child-profile', icon: 'bi-person-badge',  label: t('myChild') },
      { to: '/parent/vaccination', icon: 'bi-shield-check',    label: t('vaccines') },
      { to: '/parent/growth',      icon: 'bi-graph-up-arrow',  label: t('growth') },
      { to: '/parent/diet-plan',   icon: 'bi-egg-fried',       label: t('dietPlan') },
      { to: '/parent/ai-prediction', icon: 'bi-cpu',           label: t('bookAppt') },
      { to: '/parent/schemes',     icon: 'bi-bank',            label: t('schemes') },
      { to: '/parent/reports',     icon: 'bi-file-earmark-pdf',label: t('reports') },
      { to: '/parent/notifications', icon: 'bi-bell',          label: t('notifications') },
      { to: '/parent/settings',    icon: 'bi-gear',            label: t('settings') },
    ],
    asha: [
      { to: '/asha/dashboard',          icon: 'bi-house-door',      label: t('dashboard') },
      { to: '/asha/children',           icon: 'bi-people',          label: t('myChildren') },
      { to: '/asha/log-visit',          icon: 'bi-clipboard-plus',  label: t('logVisit') },
      { to: '/asha/vaccination-tracker',icon: 'bi-shield-check',    label: t('vaccinationTracker') },
      { to: '/asha/growth-records',     icon: 'bi-graph-up-arrow',  label: t('growthRecords') },
      { to: '/asha/malnutrition-report',icon: 'bi-exclamation-triangle', label: t('malnutritionReport') },
      { to: '/asha/visit-history',      icon: 'bi-clock-history',   label: t('visitHistory') },
      { to: '/asha/area-map',           icon: 'bi-map',             label: t('areaCoverageMap') || 'Area Map' },
      { to: '/asha/notifications',      icon: 'bi-bell',            label: t('notifications') },
      { to: '/asha/generate-report',    icon: 'bi-file-earmark-bar-graph', label: t('generateReport') },
      { to: '/asha/settings',           icon: 'bi-gear',            label: t('settings') },
    ],
    admin: [
      { to: '/admin/dashboard',     icon: 'bi-speedometer2',       label: t('dashboard') },
      { to: '/admin/heatmap',       icon: 'bi-map-fill',           label: t('districtHeatmap') },
      { to: '/admin/analytics',     icon: 'bi-bar-chart-line',     label: t('analyticsReports') },
      { to: '/admin/children',      icon: 'bi-people-fill',        label: t('childrenRegistry') },
      { to: '/admin/asha-workers',  icon: 'bi-person-badge-fill',  label: t('ashaWorkers') },
      { to: '/admin/health-centres',icon: 'bi-hospital',           label: t('healthCentreDirectory') },
      { to: '/admin/vaccination-data', icon: 'bi-shield-plus',     label: t('vaccinationData') },
      { to: '/admin/malnutrition',  icon: 'bi-exclamation-octagon',label: t('malnutritionCasesAdmin') },
      { to: '/admin/schemes',       icon: 'bi-bank',               label: t('governmentSchemes') },
      { to: '/admin/block-reports', icon: 'bi-file-earmark-excel', label: t('blockwiseReports') },
      { to: '/admin/notifications', icon: 'bi-broadcast',          label: t('notificationsPanel') },
      { to: '/admin/users',         icon: 'bi-person-gear',        label: t('userManagement') },
      { to: '/admin/audit-logs',    icon: 'bi-journal-text',       label: t('auditLogs') },
      { to: '/admin/settings',      icon: 'bi-sliders',            label: t('settingsConfig') },
    ],
  };

  const links = NAV_LINKS[role] || [];

  return (
    <div className="sidebar d-flex flex-column">
      {/* Logo / Brand */}
      <div className="p-3 border-bottom border-light border-opacity-25">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-white d-flex align-items-center justify-content-center"
            style={{ width: 36, height: 36, flexShrink: 0 }}
          >
            <i className="bi bi-heart-pulse-fill text-success fs-5"></i>
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>{t('home')}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.75 }} className="text-capitalize">{t(role === 'parent' ? 'profileTitle' : role === 'asha' ? 'ashaPortal' : 'adminPortal')?.split(' ')[0] || role} Portal</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-grow-1 py-2 overflow-auto">
        <ul className="nav flex-column">
          {links.map((link) => (
            <li className="nav-item" key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${link.icon}`}></i>
                <span style={{ fontSize: '0.875rem' }}>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="px-3 py-2">
        <button
          onClick={handleLogout}
          className="btn w-100 d-flex align-items-center justify-content-center gap-2"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          <i className="bi bi-box-arrow-right"></i>
          {t('logout') || 'Logout'}
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 border-top border-light border-opacity-25" style={{ fontSize: '0.7rem', opacity: 0.6 }}>
        {t('home')} v1.0 · DBUU 2026–27
      </div>
    </div>
  );
};

export default Sidebar;
