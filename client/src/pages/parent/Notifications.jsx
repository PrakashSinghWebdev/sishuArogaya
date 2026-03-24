import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  ['🏠 Dashboard', '/parent/dashboard'],
  ['👶 My Child', '/parent/child-profile'],
  ['💉 Vaccines', '/parent/vaccination'],
  ['📈 Growth', '/parent/growth'],
  ['🥗 Diet Plan', '/parent/diet-plan'],
  ['🏛️ Schemes', '/parent/schemes'],
  ['📋 Reports', '/parent/reports'],
  ['🔔 Notifications', '/parent/notifications'],
];

const SLIDES = [
  'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1400&q=80&fit=crop',
];

const TYPE_MAP = {
  vaccine_reminder: { icon: '💉', borderColor: '#f59e0b', bg: '#fffbeb', label: 'Vaccine Reminder', urgent: false },
  health_alert:     { icon: '⚡', borderColor: '#ef4444', bg: '#fff7ed', label: 'Health Alert', urgent: true },
  visit_reminder:   { icon: '🏥', borderColor: '#f59e0b', bg: '#f0fdff', label: 'Visit Reminder', urgent: false },
  scheme_update:    { icon: '💰', borderColor: '#059669', bg: '#f0fdf4', label: 'Scheme Update', urgent: false },
  system:           { icon: '💡', borderColor: '#0891b2', bg: '#f0fdff', label: 'System', urgent: false },
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dDay.getTime() === today.getTime()) return 'Today, ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (dDay.getTime() === yest.getTime()) return 'Yesterday, ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Notifications() {
  const { user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    notificationAPI.list()
      .then(r => setNotifications(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setCur(p => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  const markRead = async (id) => {
    await notificationAPI.markRead(id).catch(console.error);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead().catch(console.error);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const urgentCount = notifications.filter(n => n.type === 'health_alert').length;
  const reminderCount = notifications.filter(n => n.type === 'vaccine_reminder' || n.type === 'visit_reminder').length;
  const goodNewsCount = notifications.filter(n => n.type === 'scheme_update').length;
  const totalCount = notifications.length;

  const stats = [
    { label: 'Urgent Alerts', value: urgentCount, color: '#ef4444', border: '#ef4444', icon: '⚡', bg: '#fff0f0' },
    { label: 'Reminders', value: reminderCount, color: '#f59e0b', border: '#f59e0b', icon: '🔔', bg: '#fffbeb' },
    { label: 'Good News', value: goodNewsCount, color: '#059669', border: '#059669', icon: '🎉', bg: '#f0fdf4' },
    { label: 'Total This Month', value: totalCount, color: '#0891b2', border: '#0891b2', icon: '📊', bg: '#f0fdff' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#f8fffe', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .wrap{max-width:1280px;margin:0 auto;padding:24px 28px 60px}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        @media(max-width:1024px){.g4{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:768px){.navlinks{display:none!important}.g4{grid-template-columns:repeat(2,1fr)}.wrap{padding:20px 16px 60px}}
        @media(max-width:480px){.g4{grid-template-columns:1fr}}
      `}</style>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', height: 64, display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', borderBottom: '2px solid #cffafe', boxShadow: '0 2px 16px rgba(8,145,178,.1)' }}>
        <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 20 }}>🏥</div>
          <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 18, fontWeight: 700, color: '#0891b2' }}>Sishu Arogaya</div>
        </Link>
        <div className="navlinks" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, marginLeft: 8 }}>
          {NAV.map(([label, to]) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} style={{ padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap', background: active ? '#f0fdff' : 'transparent', color: active ? '#0e7490' : '#4a7a8a', fontFamily: "'DM Sans',sans-serif" }}>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ height: 240, position: 'relative', overflow: 'hidden', background: '#0e7490' }}>
        {SLIDES.map((src, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: cur === i ? 1 : 0, transition: 'opacity .9s ease' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(14,116,144,.88) 0%,rgba(8,145,178,.72) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(207,250,254,.18)', border: '1px solid rgba(207,250,254,.4)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#cffafe', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14, width: 'fit-content' }}>🏥 Notifications</div>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(26px,3vw,40px)', fontWeight: 700, color: '#fff', lineHeight: 1.15 }}>
            Health Alerts &amp; <span style={{ color: '#cffafe' }}>Reminders</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', marginTop: 10, maxWidth: 420 }}>Stay updated with vaccines, visits, and health advisories.</p>
        </div>
        <div style={{ position: 'absolute', bottom: 14, right: 24, display: 'flex', gap: 6, zIndex: 2 }}>
          {SLIDES.map((_, i) => <div key={i} onClick={() => setCur(i)} style={{ width: cur === i ? 22 : 8, height: 8, borderRadius: 4, background: cur === i ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer', transition: 'all .3s' }} />)}
        </div>
      </div>

      {/* Main content */}
      <div className="wrap">
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 22, fontWeight: 700, color: '#0c2340', marginBottom: 4 }}>🔔 Notifications</h2>
            {user && <p style={{ fontSize: 13, color: '#4a7a8a' }}>Updates and alerts for {user.name || 'your account'}</p>}
          </div>
          <button
            onClick={markAllRead}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#f0fdff', border: '1.5px solid #c5e8ef', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#0e7490', cursor: 'pointer' }}
          >
            ✓ Mark all as read
          </button>
        </div>

        {/* Stats */}
        <div className="g4" style={{ marginBottom: 28 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #c5e8ef', boxShadow: '0 2px 8px rgba(8,145,178,.06)', padding: '18px 20px', borderTop: `3px solid ${s.border}`, animation: 'fade .4s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'grid', placeItems: 'center', fontSize: 18 }}>{s.icon}</div>
              </div>
              <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#4a7a8a', marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Notifications card */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #c5e8ef', boxShadow: '0 2px 12px rgba(8,145,178,.07)', overflow: 'hidden', animation: 'fade .5s both' }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #c5e8ef', background: '#f0fdff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fee2e2', display: 'grid', placeItems: 'center', fontSize: 16 }}>🔔</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0c2340' }}>All Notifications</div>
                <div style={{ fontSize: 12, color: '#4a7a8a' }}>Sorted by most recent</div>
              </div>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#4a7a8a', cursor: 'pointer' }}>
              ⚙️ Filter
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #c5e8ef', borderTopColor: '#0891b2', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a7a8a' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔕</div>
              <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#0c2340' }}>No Notifications</div>
              <div style={{ fontSize: 13 }}>You're all caught up! No new alerts or reminders.</div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.map((n, idx) => {
                const cfg = TYPE_MAP[n.type] || TYPE_MAP.system;
                return (
                  <div
                    key={n._id}
                    style={{
                      display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12,
                      background: !n.isRead ? cfg.bg : '#fff',
                      border: `1px solid ${!n.isRead ? cfg.borderColor + '40' : '#e8f4f8'}`,
                      borderLeft: `4px solid ${cfg.borderColor}`,
                      animation: `fade .4s ease ${idx * 0.04}s both`,
                    }}
                  >
                    {/* Icon */}
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: cfg.bg, border: `1.5px solid ${cfg.borderColor}40`, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>
                      {cfg.icon}
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: '#0c2340' }}>
                          {n.title || n.message?.slice(0, 60) || 'Notification'}
                        </span>
                        {cfg.urgent && (
                          <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}>
                            Urgent
                          </span>
                        )}
                        {!n.isRead && (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.borderColor, display: 'inline-block', flexShrink: 0 }} />
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#4a7a8a', lineHeight: 1.55, marginBottom: 5 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: '#7aabb8' }}>{formatDate(n.createdAt)} · {cfg.label}</div>
                    </div>

                    {/* Mark read */}
                    {!n.isRead && (
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}>
                        <button
                          onClick={() => markRead(n._id)}
                          style={{ padding: '5px 12px', background: '#f0fdff', border: '1.5px solid #c5e8ef', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#0e7490', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid #c5e8ef', fontSize: 12, color: '#4a7a8a' }}>
          Sishu Arogaya &copy; 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
        </div>
      </div>
    </div>
  );
}
