import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ashaAPI, notificationAPI, vaccinationAPI, searchAPI } from '../../services/api';
import { AshaCoverageMapPanel } from './AreaCoverageMap';
import { MEDIA_ARRAY } from '../../components/MediaCarousel';
import SearchBar from '../../components/SearchBar';

const slideUrls = MEDIA_ARRAY.map(m => m.url);

function formatDate(dateValue) {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function childAgeLabel(dob) {
  if (!dob) return null;
  const totalMonths = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return totalMonths < 24 ? `${totalMonths} mo` : `${Math.floor(totalMonths / 12)} yr`;
}

export default function AshaDashboard() {
  const { user } = useAuth();
  const { t }    = useLanguage();

  const [profile, setProfile]             = useState(null);
  const [children, setChildren]           = useState([]);
  const [visits, setVisits]               = useState([]);
  const [overdueVaccines, setOverdueVaccines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [slideIndex, setSlideIndex]       = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError]     = useState('');
  const slideTimer = useRef(null);

  useEffect(() => {
    Promise.all([
      ashaAPI.getProfile().catch(() => ({ data: null })),
      ashaAPI.getMyChildren().catch(() => ({ data: [] })),
      ashaAPI.getVisits().catch(() => ({ data: [] })),
      vaccinationAPI.getOverdue().catch(() => ({ data: [] })),
      notificationAPI.list().catch(() => ({ data: [] })),
    ])
      .then(([profileRes, childrenRes, visitsRes, overdueRes, notifRes]) => {
        setProfile(profileRes.data);
        setChildren(childrenRes.data || []);
        setVisits((visitsRes.data || []).slice(0, 8));
        setOverdueVaccines((overdueRes.data || []).slice(0, 5));
        // only unread notifications, max 3
        setNotifications((notifRes.data || []).filter(n => !n.isRead).slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    slideTimer.current = setInterval(() => setSlideIndex(prev => (prev + 1) % MEDIA_ARRAY.length), 4500);
    return () => clearInterval(slideTimer.current);
  }, []);

  /* ── search child by childId ── */
  const handleSearchChild = async (childId) => {
    setSearchError('');
    setSearchLoading(true);
    try {
      const res = await searchAPI.ashaSearchChild(childId);
      setSearchResults([res.data.result]);
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Error searching for child');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const shortcutCards = [
    { emoji: '👶', title: t('myChildren'),           desc: 'Child list and profiles',          to: '/asha/children'             },
    { emoji: '📝', title: t('logVisit'),              desc: 'Record a new home visit',          to: '/asha/log-visit'            },
    { emoji: '💉', title: t('vaccinationTracker'),    desc: 'Overdue and due vaccines',         to: '/asha/vaccination-tracker'  },
    { emoji: '📈', title: t('growthRecords'),         desc: 'Weight, height, and trends',       to: '/asha/growth-records'       },
    { emoji: '🚨', title: t('malnutritionReport'),    desc: 'Moderate and severe cases',        to: '/asha/malnutrition-report'  },
    { emoji: '📋', title: t('visitHistory'),          desc: 'Past field visits',                to: '/asha/visit-history'        },
    { emoji: '🗺️', title: 'Area Coverage Map',        desc: 'See assigned children on map',     href: '#area-coverage'           },
    { emoji: '📤', title: t('generateReport') || 'Generate Report', desc: 'Export district file', to: '/asha/generate-report'   },
    { emoji: '⚙️', title: t('settings'),              desc: 'Profile and password settings',   to: '/asha/settings'             },
  ];

  const nutritionBadges = {
    healthy:  { bg: '#f0fdf4', border: '#6ee7b7', badgeBg: '#d1fae5', label: `✓ ${t('healthy')}`   },
    moderate: { bg: '#fffbeb', border: '#fcd34d', badgeBg: '#fef3c7', label: `⚠️ ${t('moderate')}` },
    severe:   { bg: '#fff1f2', border: '#fca5a5', badgeBg: '#fee2e2', label: `🚨 ${t('severe')}`   },
  };

  const severeCount   = children.filter(c => c.nutritionStatus === 'severe').length;
  const moderateCount = children.filter(c => c.nutritionStatus === 'moderate').length;
  const healthyCount  = children.filter(c => c.nutritionStatus === 'healthy').length;

  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const firstName  = user?.name?.split(' ')[0] || 'ASHA';
  const userInitial = (user?.name || 'A').charAt(0).toUpperCase();
  const unreadCount = notifications.length;

  const thisMonth   = new Date().getMonth();
  const monthVisits = visits.filter(v => new Date(v.visitDate || v.createdAt).getMonth() === thisMonth);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f0fdff', minHeight: '100vh', color: '#0c2340' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .an-card{background:#fff;border:1.5px solid #c5e8ef;border-radius:14px;box-shadow:0 2px 12px rgba(8,145,178,.07)}
        .an-card-hover{transition:box-shadow .2s,transform .15s;text-decoration:none;color:inherit;display:block}
        .an-card-hover:hover{box-shadow:0 6px 24px rgba(8,145,178,.16);transform:translateY(-2px)}
        .an-spinner{width:44px;height:44px;border:4px solid #cffafe;border-top-color:#0891b2;border-radius:50%;animation:spin .8s linear infinite}
        .an-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .an-g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .an-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .an-badge-ok,.an-badge-warn,.an-badge-bad{border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600}
        .an-badge-ok{background:#d1fae5;color:#065f46}
        .an-badge-warn{background:#fef3c7;color:#92400e}
        .an-badge-bad{background:#fee2e2;color:#991b1b}
        @media(max-width:1024px){.an-g4{grid-template-columns:repeat(2,1fr)}.an-g3{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:768px){.an-g4{grid-template-columns:repeat(2,1fr)}.an-g2{grid-template-columns:1fr}.an-hero-row{flex-direction:column!important}}
        @media(max-width:480px){.an-g4{grid-template-columns:1fr}.an-g3{grid-template-columns:1fr}}
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', height: 64,
        borderBottom: '2px solid #cffafe',
        boxShadow: '0 2px 16px rgba(8,145,178,.10)',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#0891b2,#0e7490)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            🏥
          </div>
          <div>
            <div style={{ fontFamily: "'Libre Baskerville',serif", fontWeight: 700, fontSize: 15, color: '#0e7490', lineHeight: 1.1 }}>
              Shishu Aarogya
            </div>
            <div style={{ fontSize: 10, color: '#4a7a8a' }}>National Child Health Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8, color: '#4a7a8a', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Dashboard Workspace
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 'auto' }}>
          <Link to="/asha/notifications" style={{ position: 'relative', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 700, borderRadius: 20,
                padding: '1px 5px', minWidth: 16, textAlign: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </Link>
          <Link to="/asha/settings" style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#0891b2,#0e7490)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none',
          }}>
            {userInitial}
          </Link>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
              borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', transition: 'all .2s', marginLeft: 4,
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
          >
            {t('logout') || 'Logout'}
          </button>
        </div>
      </nav>

      {/* hero banner with slideshow */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
        {slideUrls.map((src, idx) => (
          <div key={src} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: idx === slideIndex ? 1 : 0,
            transition: 'opacity 1.1s ease',
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(8,145,178,.93),rgba(14,116,144,.65),rgba(8,145,178,.82))' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '0 48px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="an-hero-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            <div style={{ color: '#fff', animation: 'fadeUp .5s ease both' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#cffafe', marginBottom: 8 }}>
                {t('ashaPortal')}
              </div>
              <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(22px,3vw,34px)', fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
                Namaste, {firstName}!
              </h1>
              <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, margin: '0 0 18px' }}>
                {profile?.block ? `${profile.block}, ${profile.district}` : t('ashaPortal')} · {children.length} {t('childrenAssignedLabel')} · {todayLabel}
              </p>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.82)', maxWidth: 560 }}>
                Core ASHA actions now live here in the dashboard. Use the cards below to open visits, reports, vaccination tracking, growth records, settings, and the area map.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {[
                [children.length,      t('myChildren'),    '👶'],
                [monthVisits.length,   t('visitsThisMonth'), '✅'],
                [overdueVaccines.length, t('overdue'),     '⏰'],
                [severeCount,          t('severe'),        '🚨'],
              ].map(([value, label, icon]) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,.12)',
                  border: '1px solid rgba(255,255,255,.2)',
                  borderRadius: 12, padding: '12px 14px',
                  textAlign: 'center', minWidth: 68,
                }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 22, fontWeight: 700, color: '#cffafe', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* dot indicators */}
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: 7 }}>
          {MEDIA_ARRAY.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSlideIndex(idx);
                clearInterval(slideTimer.current);
                slideTimer.current = setInterval(() => setSlideIndex(prev => (prev + 1) % MEDIA_ARRAY.length), 4500);
              }}
              style={{
                width: idx === slideIndex ? 22 : 8, height: 8, borderRadius: 8, border: 'none',
                cursor: 'pointer', padding: 0,
                background: idx === slideIndex ? '#fff' : 'rgba(255,255,255,.45)',
                transition: 'width .3s',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
            <div className="an-spinner" />
          </div>
        ) : (
          <>
            {/* ── Search Child by ID ── */}
            <div style={{ marginBottom: 22, animation: 'fadeUp .4s ease' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0c2340', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>
                  🔍 Find Child by ID
                </label>
              </div>
              <SearchBar
                placeholder="Enter Child ID (e.g., CHILD-ABC123)..."
                onSearch={handleSearchChild}
                results={searchResults}
                isLoading={searchLoading}
                noResultsMessage={searchError || 'No children found'}
                searchType="child"
              />
              {searchResults.length > 0 && (
                <div style={{ marginTop: 16, animation: 'fadeUp .3s ease' }}>
                  <Link
                    to={`/asha/child/${searchResults[0]._id}`}
                    style={{
                      display: 'block',
                      padding: '16px 20px',
                      background: '#f0f9ff',
                      border: '1.5px solid #0891b2',
                      borderRadius: 12,
                      textDecoration: 'none',
                      color: '#0c2340',
                      transition: 'all .2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#e0f7fa'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.transform = ''; }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                      {searchResults[0].name}
                    </div>
                    <div style={{ fontSize: 12, color: '#0891b2' }}>
                      ID: {searchResults[0].childId} • View profile →
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <div className="an-g4" style={{ marginBottom: 22, animation: 'fadeUp .4s ease' }}>
              <DashStatCard emoji="👶" accent="#0891b2"  label={t('totalChildren')}   value={children.length}        sub={t('assignedChildren')} />
              <DashStatCard emoji="✅" accent="#059669"  label={t('visitsThisMonth')} value={monthVisits.length}     sub={t('logVisit')} />
              <DashStatCard emoji="⏰" accent="#f59e0b"  label={t('overdueVaccines')} value={overdueVaccines.length} sub={overdueVaccines.length > 0 ? t('followUpNeeded') : t('allUpToDate')} subColor={overdueVaccines.length > 0 ? '#f59e0b' : undefined} />
              <DashStatCard emoji="🚨" accent="#ef4444"  label={t('severeCases')}     value={severeCount}            sub={t('phcReferralNeeded')} subColor={severeCount > 0 ? '#ef4444' : undefined} />
            </div>

            {severeCount > 0 && (
              <div style={{
                background: 'linear-gradient(135deg,#7f1d1d,#dc2626)',
                borderRadius: 16, padding: '18px 24px', marginBottom: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                boxShadow: '0 6px 24px rgba(220,38,38,.3)', animation: 'fadeUp .45s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(255,255,255,.15)', border: '2px solid rgba(255,255,255,.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  }}>
                    🚨
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>
                      Urgent Action
                    </div>
                    <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                      {severeCount} {severeCount > 1 ? t('severeCases') : t('severe')} - {t('malnutrition')}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>{t('phcReferralNeeded')}. {t('logVisit')}.</div>
                  </div>
                </div>
                <Link to="/asha/malnutrition-report" style={{ padding: '10px 20px', borderRadius: 10, background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  View Cases →
                </Link>
              </div>
            )}

            <div className="an-g2" style={{ marginBottom: 22, animation: 'fadeUp .5s ease' }}>
              {/* children list */}
              <div className="an-card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>👶 {t('myChildren')}</h3>
                  <Link to="/asha/children" style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>{t('viewAll')} →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {children.length === 0 ? (
                    <div style={{ color: '#4a7a8a', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>{t('noChildrenAssigned')}.</div>
                  ) : children.slice(0, 6).map(child => {
                    const status = nutritionBadges[child.nutritionStatus] || nutritionBadges.healthy;
                    const badgeCls = child.nutritionStatus === 'healthy' ? 'an-badge-ok' : child.nutritionStatus === 'moderate' ? 'an-badge-warn' : 'an-badge-bad';
                    return (
                      <Link
                        key={child._id}
                        to={`/asha/child/${child._id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '11px 13px', borderRadius: 11,
                          border: `1px solid ${status.border}`, background: status.bg,
                          textDecoration: 'none', transition: 'transform .2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: status.badgeBg, border: `2px solid ${status.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          👶
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0c2340' }}>{child.name}</div>
                          <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 2 }}>
                            {childAgeLabel(child.dob) || (child.ageInMonths ? `${child.ageInMonths} mo` : '-')} · Weight {child.currentWeight ?? '-'} kg
                          </div>
                        </div>
                        <span className={badgeCls}>{status.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* overdue vaccines */}
                <div className="an-card" style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>💉 {t('overdueVaccines')}</h3>
                    <Link to="/asha/vaccination-tracker" style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>{t('viewAll')} →</Link>
                  </div>
                  {overdueVaccines.length === 0 ? (
                    <div style={{ color: '#059669', fontSize: 13, fontWeight: 600, padding: '10px 0', textAlign: 'center' }}>{t('noOverdueVaccines')}</div>
                  ) : overdueVaccines.map(item => (
                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fcd34d', marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>💉</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0c2340' }}>{item.childId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: '#4a7a8a' }}>{item.vaccineName} · Due: {formatDate(item.dueDate)}</div>
                      </div>
                      <span className="an-badge-warn">{t('overdue')}</span>
                    </div>
                  ))}
                </div>

                {/* block health summary */}
                <div style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: 'rgba(255,255,255,.08)', borderRadius: '50%' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                    {t('blockHealthSummary')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                    {[['✅', healthyCount, t('healthy')], ['⚠️', moderateCount, t('moderate')], ['🚨', severeCount, t('severe')]].map(([icon, count, label]) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18 }}>{icon}</div>
                        <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 22, fontWeight: 700, color: '#cffafe' }}>{count}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {children.length > 0 && (
                    <>
                      <div style={{ height: 8, background: 'rgba(255,255,255,.2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round((healthyCount / children.length) * 100)}%`, height: '100%', background: '#cffafe', borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 6, textAlign: 'right' }}>
                        {Math.round((healthyCount / children.length) * 100)}% {t('healthyChildren')}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* recent visits table */}
            <div className="an-card" style={{ padding: '20px 22px', marginBottom: 22, animation: 'fadeUp .55s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>📋 {t('recentVisitLog')}</h3>
                <Link to="/asha/visit-history" style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>{t('fullHistory')} →</Link>
              </div>
              {visits.length === 0 ? (
                <div style={{ color: '#4a7a8a', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>{t('noVisitsYet')}.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f0fdff' }}>
                        {[t('childName'), t('date'), t('type'), t('weight'), t('height'), t('visitOutcome'), t('visitNotes')].map(heading => (
                          <th key={heading} style={{ padding: '9px 12px', textAlign: 'left', color: '#4a7a8a', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #c5e8ef', whiteSpace: 'nowrap' }}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((visit, i) => (
                        <tr key={visit._id || i} style={{ background: i % 2 ? '#f0fdff' : '#fff', borderBottom: '1px solid #e0f7fa' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0c2340' }}>👶 {visit.childId?.name || '-'}</td>
                          <td style={{ padding: '9px 12px', color: '#4a7a8a', fontSize: 12 }}>{formatDate(visit.visitDate || visit.createdAt)}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: '#e0f7fa', color: '#0891b2', border: '1px solid #c5e8ef' }}>
                              {visit.visitType || '-'}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px', fontWeight: 700 }}>{visit.weight ?? '-'} kg</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700 }}>{visit.height ?? '-'} cm</td>
                          <td style={{ padding: '9px 12px' }}>
                            <span className={visit.outcome === 'healthy' ? 'an-badge-ok' : visit.outcome === 'moderate' ? 'an-badge-warn' : 'an-badge-bad'}>
                              {visit.outcome === 'healthy'   ? `✓ ${t('healthy')}`
                              : visit.outcome === 'moderate' ? `⚠️ ${t('moderate')}`
                              : visit.outcome === 'severe'   ? `🚨 ${t('severe')}`
                              : visit.outcome || '-'}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 12, color: '#4a7a8a', maxWidth: 180 }}>{visit.notes?.slice(0, 60) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* shortcut cards */}
            <div style={{ marginBottom: 22, animation: 'fadeUp .6s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, margin: 0, color: '#0c2340' }}>Dashboard Shortcuts</h3>
                <span style={{ fontSize: 12, color: '#4a7a8a' }}>All key ASHA tools in one place</span>
              </div>
              <div className="an-g3">
                {shortcutCards.map(({ emoji, title, desc, to, href }) => {
                  const cardContent = (
                    <div className="an-card an-card-hover" style={{ padding: '20px 16px', textAlign: 'center', height: '100%' }}>
                      <div style={{ fontSize: 30, marginBottom: 9 }}>{emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0c2340', marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 11, color: '#4a7a8a' }}>{desc}</div>
                    </div>
                  );
                  return href
                    ? <a key={title} href={href} style={{ textDecoration: 'none' }}>{cardContent}</a>
                    : <Link key={to} to={to} style={{ textDecoration: 'none' }}>{cardContent}</Link>;
                })}
              </div>
            </div>

            {/* map panel */}
            <div id="area-coverage" className="an-card" style={{ padding: '20px 22px', marginBottom: 22, animation: 'fadeUp .62s ease' }}>
              <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#0c2340' }}>
                Area Coverage Map
              </h3>
              <AshaCoverageMapPanel childrenData={children} loading={loading} embedded />
            </div>

            {/* bottom quick-action row */}
            <div className="an-g4" style={{ animation: 'fadeUp .6s ease' }}>
              {[
                { emoji: '📝', title: t('logNewVisit'),       desc: t('logVisit'),          to: '/asha/log-visit'           },
                { emoji: '👶', title: t('myChildren'),         desc: `${t('viewAll')} ${children.length}`, to: '/asha/children' },
                { emoji: '💉', title: t('vaccinationTracker'), desc: t('overdueVaccines'),   to: '/asha/vaccination-tracker' },
                { emoji: '📊', title: t('growthRecords'),      desc: t('growthEntry'),       to: '/asha/growth-records'      },
              ].map(({ emoji, title, desc, to }) => (
                <Link key={to} to={to} className="an-card an-card-hover" style={{ padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 30, marginBottom: 9 }}>{emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0c2340', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#4a7a8a' }}>{desc}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <footer style={{ background: '#0e7490', color: 'rgba(255,255,255,.5)', textAlign: 'center', padding: '18px 24px', fontSize: 12, letterSpacing: 0.3 }}>
        Shishu Aarogya &copy; 2024 &middot; {t('homeFooter_copyright_long') || 'National Integrated Child Health Monitoring System · Government of India'}
      </footer>
    </div>
  );
}

function DashStatCard({ emoji, accent, label, value, sub, subColor }) {
  return (
    <div className="an-card" style={{ padding: '18px 20px', borderLeft: `4px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontSize: 12, color: '#4a7a8a', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#0c2340', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: subColor || '#4a7a8a', marginTop: 6, fontWeight: subColor ? 600 : 400 }}>{sub}</div>
    </div>
  );
}
