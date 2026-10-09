import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { notificationAPI } from '../services/api';

// Single navbar shared by every parent page.
export default function ParentNavbar() {
  const { user, logout } = useAuth();
  const { navLinks, t } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the profile menu on any click outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    notificationAPI.list()
      .then((res) => setUnread((res.data || []).filter((n) => !n.isRead).length))
      .catch(() => {});
  }, [pathname]);

  return (
    <nav className="pn-nav">
      <style>{`
        .pn-nav { position: sticky; top: 0; z-index: 200; background: #fff; height: 64px;
          border-bottom: 2px solid #cffafe; box-shadow: 0 2px 16px rgba(8,145,178,.10);
          display: flex; align-items: center; gap: 16px; padding: 0 24px; }
        .pn-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; text-decoration: none; }
        .pn-logo-icon { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center;
          background: linear-gradient(135deg,#0891b2,#0e7490); font-size: 20px; }
        .pn-logo-text { font-family: 'Libre Baskerville', serif; font-weight: 700; font-size: 17px; color: #0e7490; line-height: 1.1; }
        .pn-logo-tag { font-size: 10px; color: #4a7a8a; }
        .pn-links { display: flex; align-items: center; gap: 2px; flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; }
        .pn-links::-webkit-scrollbar { display: none; }
        /* auto margin (not justify-content) right-aligns without clipping the first link when it overflows */
        .pn-link:first-child { margin-left: auto; }
        .pn-link { padding: 7px 11px; border-radius: 8px; font-size: 13px; font-weight: 500; color: #4a7a8a;
          text-decoration: none; white-space: nowrap; transition: background .15s, color .15s; }
        .pn-link:hover { background: #cffafe; color: #0e7490; }
        .pn-link.active { background: #e0f7fa; color: #0e7490; font-weight: 600; }
        .pn-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; margin-left: auto; }
        .pn-bell { position: relative; text-decoration: none; font-size: 20px; line-height: 1; }
        .pn-badge { position: absolute; top: -4px; right: -6px; background: #ef4444; color: #fff; font-size: 9px;
          font-weight: 700; border-radius: 20px; padding: 1px 5px; min-width: 16px; text-align: center; }
        .pn-avatar { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
          background: linear-gradient(135deg,#0891b2,#0e7490); color: #fff; font-weight: 700; font-size: 15px;
          border: none; cursor: pointer; }
        .pn-profile { position: relative; }
        .pn-menu { position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px; background: #fff;
          border: 1px solid #cffafe; border-radius: 12px; box-shadow: 0 8px 24px rgba(8,145,178,.18); padding: 6px; }
        .pn-menu-head { padding: 8px 10px 10px; border-bottom: 1px solid #e0f7fa; margin-bottom: 4px; }
        .pn-menu-name { font-weight: 700; color: #0c2340; font-size: 14px; }
        .pn-menu-email { font-size: 11px; color: #4a7a8a; overflow: hidden; text-overflow: ellipsis; }
        .pn-menu-item { display: block; width: 100%; text-align: left; padding: 8px 10px; border-radius: 8px;
          font-size: 13px; font-weight: 500; color: #0c2340; text-decoration: none; background: none; border: none; cursor: pointer; }
        .pn-menu-item:hover { background: #e0f7fa; }
        .pn-menu-item.danger { color: #dc2626; }
        .pn-menu-item.danger:hover { background: #fee2e2; }
        @media (max-width: 768px) {
          .pn-nav { padding: 0 16px; }
          .pn-links, .pn-logo-tag { display: none; }
        }
      `}</style>

      <Link to="/parent/dashboard" className="pn-logo">
        <div className="pn-logo-icon">🏥</div>
        <div>
          <div className="pn-logo-text">Shishu Aarogya</div>
          <div className="pn-logo-tag">National Child Health Portal</div>
        </div>
      </Link>

      <div className="pn-links">
        {navLinks.map(([label, to]) => (
          <Link key={to} to={to} className={`pn-link${pathname === to ? ' active' : ''}`}>{label}</Link>
        ))}
      </div>

      <div className="pn-right">
        <Link to="/parent/notifications" className="pn-bell" aria-label={t('notifications')}>
          🔔{unread > 0 && <span className="pn-badge">{unread}</span>}
        </Link>
        <div className="pn-profile" ref={menuRef}>
          <button className="pn-avatar" aria-label="Profile menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            {(user?.name || 'P')[0].toUpperCase()}
          </button>
          {menuOpen && (
            <div className="pn-menu" role="menu">
              <div className="pn-menu-head">
                <div className="pn-menu-name">{user?.name || 'Parent'}</div>
                {user?.email && <div className="pn-menu-email">{user.email}</div>}
              </div>
              <Link to="/parent/settings" className="pn-menu-item" role="menuitem">{t('settings') || '⚙️ Settings'}</Link>
              <button className="pn-menu-item danger" role="menuitem" onClick={() => { logout(); navigate('/login'); }}>
                ⬅️ {t('logout') || 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
