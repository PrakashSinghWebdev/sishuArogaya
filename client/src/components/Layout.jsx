import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES, useLanguage } from '../context/LanguageContext';
import { useLocation as useGPSLocation } from '../context/LocationContext';

const NAV_LINKS = {
  asha: [
    { to: '/asha/dashboard', icon: 'bi-house-door', labelKey: 'dashboard', fallback: 'Dashboard' },
    { to: '/asha/children', icon: 'bi-people', labelKey: 'myChildren', fallback: 'My Children' },
    { to: '/asha/log-visit', icon: 'bi-clipboard-plus', labelKey: 'logVisit', fallback: 'Log Visit' },
    { to: '/asha/vaccination-tracker', icon: 'bi-shield-check', labelKey: 'vaccinationTracker', fallback: 'Vaccination Tracker' },
    { to: '/asha/growth-records', icon: 'bi-graph-up-arrow', labelKey: 'growthRecords', fallback: 'Growth Records' },
    { to: '/asha/malnutrition-report', icon: 'bi-exclamation-triangle', labelKey: 'malnutritionReport', fallback: 'Malnutrition Report' },
    { to: '/asha/visit-history', icon: 'bi-clock-history', labelKey: 'visitHistory', fallback: 'Visit History' },
    { to: '/asha/generate-report', icon: 'bi-file-earmark-bar-graph', labelKey: 'generateReport', fallback: 'Generate Report' },
    { to: '/asha/settings', icon: 'bi-gear', labelKey: 'settings', fallback: 'Settings' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: 'bi-speedometer2', labelKey: 'dashboard', fallback: 'Dashboard' },
    { to: '/admin/heatmap', icon: 'bi-map-fill', labelKey: 'districtHeatmap', fallback: 'District Heatmap' },
    { to: '/admin/analytics', icon: 'bi-bar-chart-line', labelKey: 'analyticsReports', fallback: 'Analytics Reports' },
    { to: '/admin/children', icon: 'bi-people-fill', labelKey: 'childrenRegistry', fallback: 'Children Registry' },
    { to: '/admin/asha-workers', icon: 'bi-person-badge-fill', labelKey: 'ashaWorkers', fallback: 'ASHA Workers' },
    { to: '/admin/health-centres', icon: 'bi-hospital', labelKey: 'healthCentreDirectory', fallback: 'Health Centres' },
    { to: '/admin/vaccination-data', icon: 'bi-shield-plus', labelKey: 'vaccinationData', fallback: 'Vaccination Data' },
    { to: '/admin/malnutrition', icon: 'bi-exclamation-octagon', labelKey: 'malnutritionCasesAdmin', fallback: 'Malnutrition Cases' },
    { to: '/admin/schemes', icon: 'bi-bank', labelKey: 'governmentSchemes', fallback: 'Government Schemes' },
    { to: '/admin/block-reports', icon: 'bi-file-earmark-excel', labelKey: 'blockwiseReports', fallback: 'Blockwise Reports' },
    { to: '/admin/notifications', icon: 'bi-broadcast', labelKey: 'notificationsPanel', fallback: 'Notifications' },
    { to: '/admin/users', icon: 'bi-person-gear', labelKey: 'userManagement', fallback: 'User Management' },
    { to: '/admin/audit-logs', icon: 'bi-journal-text', labelKey: 'auditLogs', fallback: 'Audit Logs' },
    { to: '/admin/settings', icon: 'bi-sliders', labelKey: 'settingsConfig', fallback: 'Settings' },
  ],
};

const TITLES = {
  asha: {
    dashboard: 'Field Dashboard',
    portal: 'ASHA Portal',
  },
  admin: {
    dashboard: 'District Dashboard',
    portal: 'Admin Portal',
  },
};

const stripLeadingDecorators = (value = '') =>
  String(value).replace(/^[^\p{L}\p{N}]+/u, '').trim();

const isActiveLink = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`);

const Layout = ({ children, role }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const { coords, accuracy, loading: gpsLoading } = useGPSLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = NAV_LINKS[role] || [];
  const activeLink = useMemo(
    () => links.find((link) => isActiveLink(location.pathname, link.to)) || links[0],
    [links, location.pathname]
  );

  const pageLabel = activeLink ? stripLeadingDecorators(t(activeLink.labelKey) || activeLink.fallback) : '';
  const portalLabel = TITLES[role]?.portal || 'Portal';
  const dashboardLabel = TITLES[role]?.dashboard || 'Dashboard';
  const userInitial = (user?.name || role || 'U').charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (role === 'asha') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f0fdff',
          color: '#0c2340',
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; }
          .asha-shell-secondary {
            display: inline-flex;
            align-items: center;
            padding: 7px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            color: #0e7490;
            background: #eafcff;
            border: 1px solid #c5e8ef;
            text-decoration: none;
            white-space: nowrap;
          }
          .asha-shell-main .card,
          .asha-shell-main .stat-card {
            border: 1.5px solid #c5e8ef !important;
            border-radius: 16px !important;
            box-shadow: 0 6px 24px rgba(8,145,178,.08) !important;
            background: #fff !important;
          }
          .asha-shell-main .card-header {
            background: transparent !important;
            border-bottom: 1px solid #e0f2f7 !important;
            color: #0c2340 !important;
            font-weight: 700 !important;
          }
          .asha-shell-main .table thead th {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: .02em;
            text-transform: uppercase;
            color: #4a7a8a;
            border-bottom: 1px solid #dcedf3;
            background: #f6fcff;
            white-space: nowrap;
          }
          .asha-shell-main .table > :not(caption) > * > * {
            padding: 12px 14px;
            color: #0c2340;
            border-color: #eef5f7;
            vertical-align: middle;
          }
          .asha-shell-main .form-control,
          .asha-shell-main .form-select {
            border: 1.5px solid #c5e8ef;
            border-radius: 12px;
            padding: 10px 12px;
            background: #fbfeff;
            color: #0c2340;
            box-shadow: none;
          }
          .asha-shell-main .form-control:focus,
          .asha-shell-main .form-select:focus {
            border-color: #0891b2;
            box-shadow: 0 0 0 4px rgba(8,145,178,0.12);
            background: #fff;
          }
          .asha-shell-main .btn-sa-primary,
          .asha-shell-main .btn-primary {
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #0891b2, #0e7490);
            color: #fff;
            font-weight: 700;
            box-shadow: 0 12px 24px rgba(8,145,178,0.18);
          }
          @media (max-width: 768px) {
            .asha-shell-header { padding: 18px 16px 10px !important; }
            .asha-shell-content { padding: 20px 16px 40px !important; }
          }
        `}</style>

        <div className="asha-shell-header" style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(240,253,255,.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #d8eef4',
          padding: '18px 24px 10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'linear-gradient(135deg,#0891b2,#0e7490)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#fff',
              }}>🏥</div>
              <div>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 18, color: '#0c2340', lineHeight: 1.1 }}>
                  {pageLabel || dashboardLabel}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#4a7a8a' }}>{portalLabel} · {today}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Real-time GPS badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: '999px', fontSize: 11, fontWeight: 600,
                background: coords ? '#ecfdf5' : gpsLoading ? '#fffbeb' : '#fff1f2',
                border: `1px solid ${coords ? '#6ee7b7' : gpsLoading ? '#fcd34d' : '#fca5a5'}`,
                color: coords ? '#059669' : gpsLoading ? '#92400e' : '#b91c1c',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: coords ? '#059669' : gpsLoading ? '#f59e0b' : '#ef4444',
                  animation: (coords || gpsLoading) ? 'pulse 2s infinite' : 'none',
                  display: 'inline-block',
                }} />
                {coords
                  ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}${accuracy ? ` ±${accuracy}m` : ''}`
                  : gpsLoading ? (t('locationLoading') || 'Detecting…')
                  : (t('locationDenied') || 'No GPS')}
              </div>
              {/* Language selector */}
              <select
                style={{
                  border: '1px solid #c5e8ef', background: '#fff', color: '#0c2340',
                  borderRadius: '999px', height: 34, padding: '0 10px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
                ))}
              </select>
              <Link to="/asha/notifications" className="asha-shell-secondary">
                {t('notifications') || 'Notifications'}
              </Link>
              <Link
                to="/asha/settings"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '6px 10px', borderRadius: '999px',
                  background: '#fff', border: '1px solid #d8eef4',
                  textDecoration: 'none',
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#0891b2,#0e7490)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 13,
                }}>{userInitial}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0c2340' }}>{user?.name || 'ASHA User'}</span>
              </Link>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                style={{
                  background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
                  borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .2s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
              >
                {t('logout') || 'Logout'}
              </button>
            </div>
          </div>

        </div>

        <div className="asha-shell-content asha-shell-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px 48px' }}>
          {children}
        </div>

        <footer style={{ background: '#0e7490', color: 'rgba(255,255,255,.5)', textAlign: 'center', padding: '18px 24px', fontSize: 12, letterSpacing: 0.3 }}>
        Shishu Aarogya &copy; 2024 &middot; {t('homeFooter_copyright_long') || 'National Child Health Portal · Government of India'}
      </footer>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #effbff 0%, #f8fdff 46%, #eef7fb 100%)',
        color: '#0c2340',
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .portal-shell {
          display: grid;
          grid-template-columns: 288px minmax(0, 1fr);
          min-height: 100vh;
        }

        .portal-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 22px 18px;
          background:
            radial-gradient(circle at top right, rgba(125, 211, 252, 0.32), transparent 32%),
            linear-gradient(180deg, #0f3656 0%, #10486d 42%, #0b6f86 100%);
          color: #f7fdff;
          border-right: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
        }

        .portal-sidebar::before {
          content: '';
          position: absolute;
          inset: auto -48px -56px auto;
          width: 176px;
          height: 176px;
          background: rgba(255,255,255,0.07);
          border-radius: 50%;
          pointer-events: none;
        }

        .portal-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          margin-bottom: 18px;
        }

        .portal-brand-mark {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #67e8f9, #ffffff);
          color: #0e7490;
          font-size: 22px;
          box-shadow: 0 10px 24px rgba(0,0,0,0.15);
        }

        .portal-brand-title {
          font-family: 'Libre Baskerville', serif;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.1;
          color: #ffffff;
        }

        .portal-brand-subtitle {
          font-size: 11px;
          color: rgba(255,255,255,0.74);
          margin-top: 4px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .portal-sidebar-panel {
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          padding: 14px;
          margin-bottom: 18px;
          backdrop-filter: blur(10px);
        }

        .portal-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: calc(100vh - 250px);
          overflow: auto;
          padding-right: 4px;
          position: relative;
          z-index: 1;
        }

        .portal-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          border-radius: 14px;
          text-decoration: none;
          color: rgba(255,255,255,0.82);
          transition: all 0.18s ease;
          border: 1px solid transparent;
          font-size: 13px;
          font-weight: 600;
        }

        .portal-nav-link:hover {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
          border-color: rgba(255,255,255,0.08);
        }

        .portal-nav-link.active {
          background: linear-gradient(135deg, rgba(103,232,249,0.24), rgba(255,255,255,0.16));
          color: #ffffff;
          border-color: rgba(103,232,249,0.34);
          box-shadow: 0 10px 28px rgba(4, 24, 38, 0.16);
        }

        .portal-nav-link i {
          width: 18px;
          text-align: center;
          font-size: 15px;
          flex-shrink: 0;
        }

        .portal-main {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .portal-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 28px;
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(12, 35, 64, 0.07);
        }

        .portal-topbar h1 {
          margin: 0;
          font-family: 'Libre Baskerville', serif;
          font-size: 24px;
          color: #0c2340;
        }

        .portal-topbar p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #4a7a8a;
        }

        .portal-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .portal-chip,
        .portal-lang-select {
          border: 1px solid #c5e8ef;
          background: #ffffff;
          color: #0c2340;
          border-radius: 12px;
          min-height: 40px;
          padding: 0 14px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 6px 18px rgba(8,145,178,0.06);
        }

        .portal-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .portal-chip.danger {
          color: #b91c1c;
          border-color: #fecaca;
          background: #fff8f8;
          cursor: pointer;
        }

        .portal-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0891b2, #0e7490);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(8,145,178,0.24);
        }

        .portal-content {
          padding: 28px;
        }

        .portal-hero {
          margin-bottom: 24px;
          padding: 22px 24px;
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(255,255,255,0.22), transparent 28%),
            linear-gradient(135deg, #0891b2 0%, #0e7490 58%, #115e70 100%);
          color: #ffffff;
          box-shadow: 0 24px 56px rgba(8,145,178,0.2);
        }

        .portal-hero-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 18px;
          align-items: center;
        }

        .portal-hero-kpis {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .portal-kpi {
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 14px;
          text-align: center;
        }

        .portal-kpi-value {
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
          color: #dff9ff;
          font-family: 'Libre Baskerville', serif;
        }

        .portal-kpi-label {
          margin-top: 6px;
          font-size: 11px;
          color: rgba(255,255,255,0.72);
        }

        .portal-page .card,
        .portal-page .stat-card {
          border: 1.5px solid #c5e8ef !important;
          border-radius: 18px !important;
          box-shadow: 0 10px 30px rgba(8,145,178,0.08) !important;
          background: rgba(255,255,255,0.95);
        }

        .portal-page .card-header {
          background: transparent !important;
          border-bottom: 1px solid #e3f4f8 !important;
          color: #0c2340 !important;
          font-weight: 700 !important;
          padding: 16px 18px 10px !important;
        }

        .portal-page .card-body {
          color: #0c2340;
        }

        .portal-page .table {
          margin-bottom: 0;
          --bs-table-striped-bg: #f5fcff;
          --bs-table-hover-bg: #eefafd;
        }

        .portal-page .table thead th {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #4a7a8a;
          border-bottom: 1px solid #dcedf3;
          background: #f6fcff;
          white-space: nowrap;
        }

        .portal-page .table > :not(caption) > * > * {
          padding: 12px 14px;
          color: #0c2340;
          border-color: #eef5f7;
          vertical-align: middle;
        }

        .portal-page .form-control,
        .portal-page .form-select {
          border: 1.5px solid #c5e8ef;
          border-radius: 12px;
          padding: 10px 12px;
          background: #fbfeff;
          color: #0c2340;
          box-shadow: none;
        }

        .portal-page .form-control:focus,
        .portal-page .form-select:focus {
          border-color: #0891b2;
          box-shadow: 0 0 0 4px rgba(8,145,178,0.12);
          background: #ffffff;
        }

        .portal-page .btn-sa-primary,
        .portal-page .btn-primary {
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #0891b2, #0e7490);
          color: #fff;
          font-weight: 700;
          box-shadow: 0 12px 24px rgba(8,145,178,0.18);
        }

        .portal-page .btn-outline-secondary,
        .portal-page .btn-outline-success,
        .portal-page .btn-outline-primary,
        .portal-page .btn-outline-danger {
          border-radius: 12px;
          border-width: 1.5px;
        }

        .portal-page .btn-outline-secondary {
          border-color: #c5e8ef;
          color: #0e7490;
          background: #ffffff;
        }

        .portal-page .btn-outline-secondary:hover,
        .portal-page .btn-outline-primary:hover,
        .portal-page .btn-outline-success:hover {
          background: #eafcff;
          color: #0e7490;
        }

        .portal-page .badge {
          border-radius: 999px;
          padding: 0.45em 0.7em;
          font-weight: 700;
        }

        .portal-page .bg-purple {
          background-color: #0e7490 !important;
        }

        .portal-page .text-purple {
          color: #0e7490 !important;
        }

        .portal-mobile-toggle {
          display: none;
          border: 1px solid #c5e8ef;
          background: #ffffff;
          border-radius: 12px;
          width: 42px;
          height: 42px;
          color: #0c2340;
        }

        .portal-mobile-nav {
          display: none;
        }

        @media (max-width: 1100px) {
          .portal-shell {
            grid-template-columns: 1fr;
          }

          .portal-sidebar {
            display: none;
          }

          .portal-mobile-nav {
            display: ${mobileOpen ? 'block' : 'none'};
            padding: 0 28px 18px;
          }

          .portal-mobile-nav .portal-nav {
            background: linear-gradient(180deg, #0f3656 0%, #0b6f86 100%);
            border-radius: 20px;
            padding: 14px;
            max-height: none;
          }

          .portal-mobile-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        }

        @media (max-width: 900px) {
          .portal-topbar,
          .portal-content {
            padding-left: 18px;
            padding-right: 18px;
          }

          .portal-hero-grid {
            grid-template-columns: 1fr;
          }

          .portal-hero-kpis {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 640px) {
          .portal-topbar {
            flex-direction: column;
            align-items: stretch;
          }

          .portal-actions {
            justify-content: space-between;
          }

          .portal-hero-kpis {
            grid-template-columns: 1fr;
          }

          .portal-page .row > [class*='col-'] {
            width: 100%;
          }
        }
      `}</style>

      <div className="portal-shell portal-page">
        <aside className="portal-sidebar">
          <Link to={links[0]?.to || '/'} className="portal-brand">
            <div className="portal-brand-mark">🏥</div>
            <div>
              <div className="portal-brand-title">Shishu Aarogya</div>
              <div className="portal-brand-subtitle">National Child Health Portal</div>
            </div>
          </Link>

          <div className="portal-sidebar-panel">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.66)', marginBottom: 8 }}>
              Active Workspace
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{pageLabel || dashboardLabel}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>
              {role === 'admin' ? 'District operations and oversight' : 'Field operations and child follow-up'}
            </div>
          </div>

          <nav className="portal-nav">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`portal-nav-link${isActiveLink(location.pathname, link.to) ? ' active' : ''}`}
              >
                <i className={`bi ${link.icon}`} />
                <span>{stripLeadingDecorators(t(link.labelKey) || link.fallback)}</span>
              </Link>
            ))}
          </nav>

          <div style={{ position: 'relative', zIndex: 1, marginTop: 18, fontSize: 11, color: 'rgba(255,255,255,0.62)' }}>
            Connected role: <span style={{ color: '#fff', fontWeight: 700, textTransform: 'capitalize' }}>{role}</span>
          </div>
        </aside>

        <main className="portal-main">
          <header className="portal-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" className="portal-mobile-toggle" onClick={() => setMobileOpen((v) => !v)}>
                <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`} />
              </button>
              <div>
                <h1>{pageLabel || dashboardLabel}</h1>
                <p>{today}</p>
              </div>
            </div>

            <div className="portal-actions">
              <select
                className="portal-lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
              <Link to={`/${role}/notifications`} className="portal-chip">
                <i className="bi bi-bell" />
                <span>{stripLeadingDecorators(t('notifications') || 'Notifications')}</span>
              </Link>
              <div className="portal-chip" style={{ gap: 10 }}>
                <span className="portal-avatar">{userInitial}</span>
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                  <strong style={{ fontSize: 12 }}>{user?.name || 'Portal User'}</strong>
                  <span style={{ fontSize: 11, color: '#4a7a8a', textTransform: 'capitalize' }}>{role}</span>
                </span>
              </div>
              <button type="button" className="portal-chip danger" onClick={() => { logout(); navigate('/login'); }}>
                <i className="bi bi-box-arrow-right" />
                <span>{t('logout') || 'Logout'}</span>
              </button>
            </div>
          </header>

          <div className="portal-mobile-nav">
            <nav className="portal-nav">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`portal-nav-link${isActiveLink(location.pathname, link.to) ? ' active' : ''}`}
                >
                  <i className={`bi ${link.icon}`} />
                  <span>{stripLeadingDecorators(t(link.labelKey) || link.fallback)}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="portal-content">
            <section className="portal-hero">
              <div className="portal-hero-grid">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', marginBottom: 8 }}>
                    {portalLabel}
                  </div>
                  <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 'clamp(22px, 3vw, 30px)', lineHeight: 1.25, marginBottom: 10 }}>
                    {role === 'admin'
                      ? 'District monitoring with the same calm, health-first experience as the parent and ASHA portals.'
                      : 'Field workflows arranged in one consistent space so visits, reports, and follow-up actions stay aligned.'}
                  </div>
                  <div style={{ maxWidth: 680, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                    {role === 'admin'
                      ? 'Live data pages continue using the connected backend APIs while the layout, spacing, and card treatment stay visually consistent across the admin workspace.'
                      : 'This shared shell keeps form pages, detail views, and map/report screens responsive and visually aligned with the newer dashboards.'}
                  </div>
                </div>

                <div className="portal-hero-kpis">
                  <div className="portal-kpi">
                    <div className="portal-kpi-value">{links.length}</div>
                    <div className="portal-kpi-label">Workspace Pages</div>
                  </div>
                  <div className="portal-kpi">
                    <div className="portal-kpi-value">{role === 'admin' ? 'DB' : 'API'}</div>
                    <div className="portal-kpi-label">Connected Source</div>
                  </div>
                  <div className="portal-kpi">
                    <div className="portal-kpi-value">{role.toUpperCase()}</div>
                    <div className="portal-kpi-label">Current Role</div>
                  </div>
                </div>
              </div>
            </section>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
