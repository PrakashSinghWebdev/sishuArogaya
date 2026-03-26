import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const NAV_LINKS = {
  parent: [
    { to: '/parent/dashboard',   icon: 'bi-house-door',      label: 'Dashboard' },
    { to: '/parent/child-profile', icon: 'bi-person-badge',  label: 'Child Profile' },
    { to: '/parent/vaccination', icon: 'bi-shield-check',    label: 'Vaccination' },
    { to: '/parent/growth',      icon: 'bi-graph-up-arrow',  label: 'Growth Monitoring' },
    { to: '/parent/diet-plan',   icon: 'bi-egg-fried',       label: 'Diet Plan' },
    { to: '/parent/ai-prediction', icon: 'bi-cpu',           label: 'AI Prediction' },
    { to: '/parent/schemes',     icon: 'bi-bank',            label: 'Govt. Schemes' },
    { to: '/parent/reports',     icon: 'bi-file-earmark-pdf',label: 'Health Reports' },
    { to: '/parent/notifications', icon: 'bi-bell',          label: 'Notifications' },
    { to: '/parent/settings',    icon: 'bi-gear',            label: 'Settings' },
  ],
  asha: [
    { to: '/asha/dashboard',          icon: 'bi-house-door',      label: 'Dashboard' },
    { to: '/asha/children',           icon: 'bi-people',          label: 'My Children' },
    { to: '/asha/log-visit',          icon: 'bi-clipboard-plus',  label: 'Log Visit' },
    { to: '/asha/vaccination-tracker',icon: 'bi-shield-check',    label: 'Vaccination Tracker' },
    { to: '/asha/growth-records',     icon: 'bi-graph-up-arrow',  label: 'Growth Records' },
    { to: '/asha/malnutrition-report',icon: 'bi-exclamation-triangle', label: 'Malnutrition Report' },
    { to: '/asha/visit-history',      icon: 'bi-clock-history',   label: 'Visit History' },
    { to: '/asha/area-map',           icon: 'bi-map',             label: 'Area Map' },
    { to: '/asha/notifications',      icon: 'bi-bell',            label: 'Notifications' },
    { to: '/asha/generate-report',    icon: 'bi-file-earmark-bar-graph', label: 'Generate Report' },
    { to: '/asha/settings',           icon: 'bi-gear',            label: 'Settings' },
  ],
  admin: [
    { to: '/admin/dashboard',     icon: 'bi-speedometer2',       label: 'Dashboard' },
    { to: '/admin/heatmap',       icon: 'bi-map-fill',           label: 'District Heatmap' },
    { to: '/admin/analytics',     icon: 'bi-bar-chart-line',     label: 'Analytics & Reports' },
    { to: '/admin/children',      icon: 'bi-people-fill',        label: 'Children Registry' },
    { to: '/admin/asha-workers',  icon: 'bi-person-badge-fill',  label: 'ASHA Workers' },
    { to: '/admin/health-centres',icon: 'bi-hospital',           label: 'Health Centres' },
    { to: '/admin/vaccination-data', icon: 'bi-shield-plus',     label: 'Vaccination Data' },
    { to: '/admin/malnutrition',  icon: 'bi-exclamation-octagon',label: 'Malnutrition Cases' },
    { to: '/admin/schemes',       icon: 'bi-bank',               label: 'Govt. Schemes' },
    { to: '/admin/block-reports', icon: 'bi-file-earmark-excel', label: 'Block-wise Reports' },
    { to: '/admin/notifications', icon: 'bi-broadcast',          label: 'Notifications' },
    { to: '/admin/users',         icon: 'bi-person-gear',        label: 'User Management' },
    { to: '/admin/audit-logs',    icon: 'bi-journal-text',       label: 'Audit Logs' },
    { to: '/admin/settings',      icon: 'bi-sliders',            label: 'Settings' },
  ],
};

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'parent';
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
            <div className="fw-bold" style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>Sishu Arogaya</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.75 }} className="text-capitalize">{role} Portal</div>
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

      {/* Footer */}
      <div className="p-3 border-top border-light border-opacity-25" style={{ fontSize: '0.7rem', opacity: 0.6 }}>
        Sishu Arogaya v1.0 · DBUU 2026–27
      </div>
    </div>
  );
};

export default Sidebar;
