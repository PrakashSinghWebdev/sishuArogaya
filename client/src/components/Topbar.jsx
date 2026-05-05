import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES, normalizeText, useLanguage } from '../context/LanguageContext';

const Topbar = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const activeLang = LANGUAGES.find((lang) => lang.code === language);
  const portalLabel = user?.role
    ? t(user.role === 'asha' ? 'ashaPortal' : user.role === 'admin' ? 'adminPortal' : 'profileTitle')
    : t('home');

  return (
    <div className="topbar d-flex align-items-center justify-content-between">
      <div className="fw-semibold text-muted" style={{ fontSize: '0.9rem' }}>
        <i className="bi bi-geo-alt-fill me-1 text-success"></i>
        {portalLabel}
      </div>

      <div className="d-flex align-items-center gap-3">
        <Link
          to={`/${user?.role}/notifications`}
          className="text-secondary position-relative"
          style={{ textDecoration: 'none' }}
        >
          <i className="bi bi-bell fs-5"></i>
        </Link>

        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 px-3"
            data-bs-toggle="dropdown"
            onClick={() => {}}
            style={{ borderRadius: '20px', fontWeight: 600 }}
          >
            <span style={{ fontSize: '1rem' }}>{activeLang?.flag || '🌐'}</span>
            <span className="d-none d-md-inline" style={{ fontSize: '0.8rem' }}>
              {activeLang?.label}
            </span>
            <span className="d-md-none" style={{ fontSize: '0.8rem' }}>
              {language?.slice(0, 3)}
            </span>
          </button>

          <ul
            className="dropdown-menu dropdown-menu-end shadow-lg border-0 py-3"
            style={{
              width: 'min(90vw, 420px)',
              maxHeight: '450px',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '12px',
            }}
          >
            <div className="px-3 pb-2 mb-2 border-bottom">
              <h6 className="mb-0 small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.05em' }}>
                {t('langTitle')}
              </h6>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '4px',
              }}
            >
              {LANGUAGES.map((lang) => (
                <li key={lang.code} style={{ listStyle: 'none' }}>
                  <button
                    className={`dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 ${
                      language === lang.code ? 'bg-primary text-white' : ''
                    }`}
                    onClick={() => setLanguage(lang.code)}
                    style={{ fontSize: '0.85rem', transition: 'all 0.2s' }}
                  >
                    <span className="fs-6">{lang.flag}</span>
                    <span className="text-truncate">{lang.label}</span>
                  </button>
                </li>
              ))}
            </div>

            <li><hr className="dropdown-divider mx-3" /></li>
            <li className="px-2">
              <button
                className="btn btn-link btn-sm text-decoration-none w-100 text-center text-muted fw-semibold"
                onClick={() => navigate(`/${user?.role || 'parent'}/settings`)}
              >
                {normalizeText(`${t('settings')} →`)}
              </button>
            </li>
          </ul>
        </div>

        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-secondary dropdown-toggle"
            data-bs-toggle="dropdown"
          >
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
              <button className="dropdown-item text-danger" onClick={() => { logout(); navigate('/login'); }}>
                <i className="bi bi-box-arrow-right me-2"></i>
                {t('logout')}
              </button>
            </li>
          </ul>
        </div>

        <button
          className="btn btn-sm btn-danger d-flex align-items-center gap-1 px-3"
          onClick={() => { logout(); navigate('/login'); }}
          style={{ borderRadius: '20px', fontWeight: 600 }}
        >
          <i className="bi bi-box-arrow-right"></i>
          <span className="d-none d-md-inline">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Topbar;
