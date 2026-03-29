import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ashaAPI, growthAPI, notificationAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  primary: '#0891b2', dark: '#0e7490', bg: '#f0fdff',
  light: '#cffafe', border: '#c5e8ef', text: '#0c2340', muted: '#4a7a8a',
};

const statusFromZ = (z) => {
  if (z == null || isNaN(z)) return 'healthy';
  if (z < -3) return 'severe';
  if (z < -2) return 'moderate';
  return 'healthy';
};

const fmt = (d) => {
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const shortDate = (d) => {
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// ─── Styles injected once ─────────────────────────────────────────────────────
const STYLES = `
  .an-nav-link { color:${C.muted}; text-decoration:none; padding:6px 10px; border-radius:8px; font-size:13.5px; font-weight:500; transition:background .15s,color .15s; white-space:nowrap; }
  .an-nav-link:hover { background:${C.light}; color:${C.dark}; }
  .an-nav-link.active { background:${C.primary}; color:#fff; }
  .an-card { background:#fff; border:1px solid ${C.border}; border-radius:14px; box-shadow:0 2px 8px rgba(8,145,178,.07); }
  .an-spinner { width:36px;height:36px;border:3.5px solid ${C.light};border-top-color:${C.primary};border-radius:50%;animation:spin .7s linear infinite; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  .gr-child-item { cursor:pointer; padding:10px 14px; border-radius:10px; border:1px solid transparent; transition:all .15s; }
  .gr-child-item:hover { border-color:${C.border}; background:${C.bg}; }
  .gr-child-item.selected { border-color:${C.primary}; background:${C.light}; }
  .gr-bar { transition:height .4s cubic-bezier(.4,0,.2,1); border-radius:4px 4px 0 0; cursor:pointer; }
  .gr-bar:hover { filter:brightness(1.12); }
  .gr-input { width:100%; border:1px solid ${C.border}; border-radius:8px; padding:8px 12px; font-size:13px; color:${C.text}; outline:none; transition:border .15s; }
  .gr-input:focus { border-color:${C.primary}; box-shadow:0 0 0 3px rgba(8,145,178,.12); }
  .gr-btn { display:inline-flex;align-items:center;gap:6px; padding:8px 18px; border-radius:9px; font-size:13.5px; font-weight:600; border:none; cursor:pointer; transition:all .15s; }
  .gr-btn-primary { background:${C.primary}; color:#fff; }
  .gr-btn-primary:hover:not(:disabled) { background:${C.dark}; }
  .gr-btn-primary:disabled { opacity:.55; cursor:not-allowed; }
  .gr-btn-outline { background:#fff; color:${C.primary}; border:1.5px solid ${C.primary}; }
  .gr-btn-outline:hover { background:${C.light}; }
`;

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ unread, nav_items, portalLabel }) {
  const nav = useNavigate();
  const path = window.location.pathname;
  const logout = () => { localStorage.removeItem('sa_token'); window.location.href = '/login'; };

  return (
    <nav style={{
      position:'sticky', top:0, zIndex:100, height:64,
      background:'#fff', borderBottom:`1px solid ${C.border}`,
      display:'flex', alignItems:'center', padding:'0 24px', gap:16,
      boxShadow:'0 2px 10px rgba(8,145,178,.08)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:8 }}>
        <span style={{ fontSize:26 }}>🏥</span>
        <div>
          <div style={{ fontWeight:800, fontSize:15, color:C.text, lineHeight:1.2 }}>Sishu Arogaya</div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:500 }}>{portalLabel}</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:2, flex:1, overflowX:'auto' }}>
        {nav_items.map(([label, href]) => (
          <a key={href} href={href}
            className={`an-nav-link${path === href ? ' active' : ''}`}
            onClick={e => { e.preventDefault(); nav(href); }}
          >{label}</a>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <a href="/asha/notifications"
          style={{ position:'relative', color:C.muted, textDecoration:'none', fontSize:20 }}
          onClick={e => { e.preventDefault(); nav('/asha/notifications'); }}
        >
          🔔
          {unread > 0 && (
            <span style={{
              position:'absolute', top:-4, right:-4, background:'#ef4444',
              color:'#fff', fontSize:10, fontWeight:700, borderRadius:'50%',
              width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center',
            }}>{unread > 9 ? '9+' : unread}</span>
          )}
        </a>
        <div style={{
          width:34, height:34, borderRadius:'50%',
          background:`linear-gradient(135deg,${C.primary},${C.dark})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer',
        }} title="Logout" onClick={logout}>A</div>
      </div>
    </nav>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ records }) {
  const [hovered, setHovered] = useState(null);
  if (!records.length) return (
    <div style={{ textAlign:'center', padding:'32px 0', color:C.muted, fontSize:13 }}>
      No growth data to chart yet.
    </div>
  );

  const maxW = Math.max(...records.map(r => Number(r.weight) || 0), 1);
  const last8 = records.slice(-8);

  return (
    <div style={{ padding:'4px 0' }}>
      <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:10 }}>
        Weight Over Time (kg)
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:110 }}>
        {last8.map((r, i) => {
          const pct = ((Number(r.weight) || 0) / (maxW * 1.15)) * 100;
          const isHov = hovered === i;
          return (
            <div key={r._id || i}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHov && (
                <div style={{
                  background:C.text, color:'#fff', fontSize:10, fontWeight:600,
                  padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap',
                }}>{r.weight} kg</div>
              )}
              <div className="gr-bar"
                style={{
                  width:'100%', height:`${pct}%`,
                  minHeight:4,
                  background: isHov
                    ? `linear-gradient(180deg,${C.light},${C.dark})`
                    : 'linear-gradient(180deg,#cffafe,#0891b2)',
                  boxShadow: isHov ? `0 0 0 2px ${C.primary}` : 'none',
                }}
              />
              <div style={{ fontSize:10, color:C.muted, textAlign:'center', lineHeight:1.2 }}>
                {shortDate(r.date || r.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Z-score bar ──────────────────────────────────────────────────────────────
function ZScoreBar({ label, z, ssMap }) {
  if (z == null || isNaN(z)) return null;
  // Map z from [-4, +4] to [0%, 100%]
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const pct = ((clamp(z, -4, 4) + 4) / 8) * 100;
  const status = statusFromZ(z);
  const s = ssMap[status];

  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, marginBottom:5 }}>
        <span style={{ color:C.text }}>{label}</span>
        <span style={{ color:s.color }}>z = {z.toFixed(2)}</span>
      </div>
      <div style={{
        height:10, background:'#e5e7eb', borderRadius:99, position:'relative', overflow:'visible',
      }}>
        <div style={{
          width:`${pct}%`, height:'100%',
          background:`linear-gradient(90deg,#ef4444 0%,#f59e0b 40%,#22c55e 80%)`,
          borderRadius:99,
        }} />
        <div style={{
          position:'absolute', top:'50%', left:`${pct}%`,
          transform:'translate(-50%,-50%)',
          width:14, height:14, borderRadius:'50%',
          background:s.color, border:'2px solid #fff',
          boxShadow:'0 1px 4px rgba(0,0,0,.2)',
        }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.muted, marginTop:3 }}>
        <span>−4 (Severe)</span><span>0 (Median)</span><span>+4 (Above)</span>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, icon }) {
  return (
    <div className="an-card" style={{ padding:'18px 20px', borderLeft:`4px solid ${accent}`, animation:'fadeUp .4s ease' }}>
      <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:28, fontWeight:800, color:accent }}>{value}</div>
      <div style={{ fontSize:12, color:C.muted, fontWeight:500, marginTop:2 }}>{label}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const GrowthRecords = () => {
  const { t } = useLanguage();
  const NAV = [
    [`🏠 ${t('dashboard')}`,         '/asha/dashboard'],
    [`👶 ${t('myChildren')}`,         '/asha/children'],
    [`📝 ${t('logVisit')}`,           '/asha/log-visit'],
    [`💉 ${t('vaccinationTracker')}`, '/asha/vaccination-tracker'],
    [`📈 ${t('growthRecords')}`,      '/asha/growth-records'],
    [`🚨 ${t('malnutritionReport')}`, '/asha/malnutrition-report'],
    [`📋 ${t('visitHistory')}`,       '/asha/visit-history'],
    [`🔔 ${t('notifications')}`,      '/asha/notifications'],
  ];
  const SS = {
    healthy:  { bg:'#f0fdf4', border:'#6ee7b7', color:'#059669', bbg:'#d1fae5', grad:'linear-gradient(90deg,#059669,#34d399)', label:`✓ ${t('healthy')}`   },
    moderate: { bg:'#fffbeb', border:'#fcd34d', color:'#92400e', bbg:'#fef3c7', grad:'linear-gradient(90deg,#f59e0b,#fbbf24)', label:`⚠ ${t('moderate')}`  },
    severe:   { bg:'#fff1f2', border:'#fca5a5', color:'#991b1b', bbg:'#fee2e2', grad:'linear-gradient(90deg,#ef4444,#f87171)', label:`🚨 ${t('severe')}`    },
  };

  const [children, setChildren]               = useState([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [growth, setGrowth]                   = useState([]);
  const [logOpen, setLogOpen]                 = useState(false);
  const [logForm, setLogForm]                 = useState({ weight:'', height:'', hc:'', date: new Date().toISOString().slice(0,10) });
  const [saving, setSaving]                   = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [gLoading, setGLoading]               = useState(false);
  const [error, setError]                     = useState('');
  const [saveError, setSaveError]             = useState('');
  const [unread, setUnread]                   = useState(0);
  const [search, setSearch]                   = useState('');

  // Fetch child list
  useEffect(() => {
    style_inject();
    ashaAPI.getMyChildren()
      .then(r => {
        const list = r.data || [];
        setChildren(list);
        if (list.length) {
          setSelectedChildIndex(0);
          setSelectedChildId(list[0]._id);
        }
      })
      .catch(() => setError('Failed to load children.'))
      .finally(() => setLoading(false));

    notificationAPI.list()
      .then(r => setUnread((r.data || []).filter(n => !n.isRead).length))
      .catch(() => {});
  }, []);

  // Fetch growth when child changes
  const fetchGrowth = useCallback((cid) => {
    if (!cid) return;
    setGLoading(true);
    growthAPI.getHistory(cid)
      .then(r => setGrowth(r.data || []))
      .catch(() => setGrowth([]))
      .finally(() => setGLoading(false));
  }, []);

  useEffect(() => {
    if (selectedChildId) fetchGrowth(selectedChildId);
  }, [selectedChildId, fetchGrowth]);

  const selectChild = (idx) => {
    setSelectedChildIndex(idx);
    setSelectedChildId(children[idx]._id);
    setLogOpen(false);
  };

  const handleSave = async () => {
    if (!logForm.weight || !logForm.height || !logForm.date) {
      setSaveError('Weight, height and date are required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await growthAPI.add({
        childId: selectedChildId,
        weight: Number(logForm.weight),
        height: Number(logForm.height),
        headCircumference: logForm.hc ? Number(logForm.hc) : undefined,
        date: logForm.date,
      });
      await fetchGrowth(selectedChildId);
      setLogOpen(false);
      setLogForm({ weight:'', height:'', hc:'', date: new Date().toISOString().slice(0,10) });
    } catch (e) {
      setSaveError(e?.response?.data?.message || 'Failed to save measurement.');
    } finally {
      setSaving(false);
    }
  };

  // Derived stats
  const selectedChild = children[selectedChildIndex] || null;
  const latest = growth.length ? growth[growth.length - 1] : null;
  const totalMonitored = children.length;
  const normalCount   = children.filter(c => {
    const z = c.weightForAgeZ ?? c.waz;
    return z == null || z >= -1;
  }).length;
  const moderateCount = children.filter(c => {
    const z = c.weightForAgeZ ?? c.waz;
    return z != null && z < -1 && z >= -3;
  }).length;
  const severeCount = children.filter(c => {
    const z = c.weightForAgeZ ?? c.waz;
    return z != null && z < -3;
  }).length;

  const filteredChildren = children.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const style_inject = () => {
    if (document.getElementById('gr-styles')) return;
    const s = document.createElement('style');
    s.id = 'gr-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  };

  if (loading) return (
    <>
      <Navbar unread={unread} nav_items={NAV} portalLabel={t('ashaPortal')} />
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh', background:C.bg }}>
        <div className="an-spinner" />
      </div>
    </>
  );

  if (error) return (
    <>
      <Navbar unread={unread} nav_items={NAV} portalLabel={t('ashaPortal')} />
      <div style={{ background:C.bg, minHeight:'100vh', display:'flex', justifyContent:'center', alignItems:'center' }}>
        <div style={{ background:'#fff1f2', border:'1px solid #fca5a5', borderRadius:12, padding:'24px 32px', color:'#991b1b', fontWeight:600 }}>
          {error}
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar unread={unread} nav_items={NAV} portalLabel={t('ashaPortal')} />
      <div style={{ background:C.bg, minHeight:'100vh', padding:'28px 24px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:C.text, margin:0 }}>📈 {t('growthRecords')}</h1>
            <p style={{ fontSize:13, color:C.muted, margin:'4px 0 0' }}>
              Monitor weight, height and z-scores for your assigned children
            </p>
          </div>
          {selectedChild && (
            <button className="gr-btn gr-btn-primary"
              onClick={() => setLogOpen(o => !o)}
            >
              {logOpen ? `✕ ${t('cancel')}` : `+ ${t('growthEntry')}`}
            </button>
          )}
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
          <StatCard label={`${t('healthy')} (WAZ ≥ −1)`}  value={normalCount}    accent="#059669"   icon="✅" />
          <StatCard label={t('moderate')}               value={moderateCount}  accent="#f59e0b"   icon="⚠️" />
          <StatCard label={`${t('severe')} Cases`}              value={severeCount}    accent="#ef4444"   icon="🚨" />
          <StatCard label={t('totalChildren')}          value={totalMonitored} accent={C.primary} icon="👶" />
        </div>

        {/* Inline log form */}
        {logOpen && selectedChild && (
          <div className="an-card" style={{ padding:20, marginBottom:20, animation:'fadeUp .3s ease' }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:14, fontSize:15 }}>
              📋 {t('growthEntry')} — {selectedChild.name}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
              {[
                { key:'weight', label:`${t('weight')} (kg)`, placeholder:'e.g. 8.5' },
                { key:'height', label:`${t('height')} (cm)`, placeholder:'e.g. 70' },
                { key:'hc',     label:'Head Circ. (cm)',     placeholder:'e.g. 42' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:5 }}>{label}</label>
                  <input className="gr-input" type="number" placeholder={placeholder}
                    value={logForm[key]}
                    onChange={e => setLogForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.muted, display:'block', marginBottom:5 }}>{t('date')}</label>
                <input className="gr-input" type="date"
                  value={logForm.date}
                  onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            {saveError && (
              <div style={{ color:'#991b1b', background:'#fff1f2', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 12px', fontSize:13, marginBottom:10 }}>
                {saveError}
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button className="gr-btn gr-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? `💾 ${t('loading')}…` : `💾 ${t('save')}`}
              </button>
              <button className="gr-btn gr-btn-outline" onClick={() => { setLogOpen(false); setSaveError(''); }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* 2-column layout */}
        <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Child selector */}
            <div className="an-card" style={{ padding:16 }}>
              <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:10 }}>
                👶 {t('myChildren')} ({children.length})
              </div>
              <input className="gr-input" placeholder={t('searchByName')} value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom:10 }}
              />
              {filteredChildren.length === 0 ? (
                <div style={{ color:C.muted, fontSize:13, padding:'12px 0', textAlign:'center' }}>
                  {t('noChildrenAssigned')}
                </div>
              ) : (
                <div style={{ maxHeight:260, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
                  {filteredChildren.map((c) => {
                    const realIdx = children.indexOf(c);
                    const isSelected = realIdx === selectedChildIndex;
                    const z = c.weightForAgeZ ?? c.waz;
                    const status = statusFromZ(z);
                    const s = SS[status];
                    return (
                      <div key={c._id}
                        className={`gr-child-item${isSelected ? ' selected' : ''}`}
                        onClick={() => selectChild(realIdx)}
                      >
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{c.name}</div>
                            <div style={{ fontSize:11, color:C.muted }}>
                              {c.ageInMonths != null ? `${c.ageInMonths} months` : '—'}
                              {c.gender ? ` · ${c.gender}` : ''}
                            </div>
                          </div>
                          <span style={{
                            fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
                            background:s.bbg, color:s.color,
                          }}>{s.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bar chart */}
            <div className="an-card" style={{ padding:16 }}>
              <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:6 }}>
                📊 {t('weight')} Chart
                {selectedChild && <span style={{ fontWeight:400, color:C.muted, fontSize:12 }}> — {selectedChild.name}</span>}
              </div>
              {gLoading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:20 }}>
                  <div className="an-spinner" style={{ width:24, height:24 }} />
                </div>
              ) : (
                <BarChart records={growth} />
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {!selectedChild ? (
              <div className="an-card" style={{ padding:40, textAlign:'center', color:C.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📈</div>
                <div style={{ fontWeight:600 }}>Select a child to view {t('growthRecords')}</div>
              </div>
            ) : (
              <>
                {/* Current vitals card */}
                <div className="an-card" style={{ padding:20 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:17, color:C.text }}>{selectedChild.name}</div>
                      <div style={{ fontSize:12, color:C.muted }}>
                        {selectedChild.ageInMonths != null ? `${selectedChild.ageInMonths} months old` : '—'}
                        {selectedChild.gender ? ` · ${selectedChild.gender}` : ''}
                        {selectedChild.bloodGroup ? ` · Blood: ${selectedChild.bloodGroup}` : ''}
                      </div>
                    </div>
                    {(() => {
                      const z = latest?.weightForAgeZ ?? selectedChild?.weightForAgeZ;
                      const status = statusFromZ(z);
                      const s = SS[status];
                      return (
                        <span style={{
                          padding:'5px 14px', borderRadius:99,
                          background:s.bbg, color:s.color, fontWeight:700, fontSize:12,
                        }}>{s.label}</span>
                      );
                    })()}
                  </div>

                  {latest ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                      {[
                        { label: t('weight'),    value: latest.weight ? `${latest.weight} kg` : '—', icon:'⚖️' },
                        { label: t('height'),    value: latest.height ? `${latest.height} cm` : '—', icon:'📏' },
                        { label: 'Head Circ.',   value: latest.headCircumference ? `${latest.headCircumference} cm` : '—', icon:'🔵' },
                      ].map(({ label, value, icon }) => (
                        <div key={label} style={{
                          background:C.bg, border:`1px solid ${C.border}`,
                          borderRadius:10, padding:'12px 14px', textAlign:'center',
                        }}>
                          <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                          <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{value}</div>
                          <div style={{ fontSize:11, color:C.muted, fontWeight:500 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px', color:C.muted, fontSize:13, textAlign:'center', marginBottom:16 }}>
                      {t('noRecords')}
                    </div>
                  )}

                  {/* Z-score display */}
                  {latest && (
                    <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:C.text, marginBottom:12 }}>
                        WHO Z-Scores
                      </div>
                      <ZScoreBar label="Weight-for-Age Z (WAZ)"   z={latest.weightForAgeZ} ssMap={SS} />
                      <ZScoreBar label="Height-for-Age Z (HAZ)"   z={latest.heightForAgeZ} ssMap={SS} />
                    </div>
                  )}
                </div>

                {/* Growth history table */}
                <div className="an-card" style={{ overflow:'hidden' }}>
                  <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, fontWeight:700, fontSize:14, color:C.text }}>
                    📋 {t('growthRecords')}
                  </div>
                  {gLoading ? (
                    <div style={{ display:'flex', justifyContent:'center', padding:28 }}>
                      <div className="an-spinner" />
                    </div>
                  ) : growth.length === 0 ? (
                    <div style={{ padding:'28px 20px', textAlign:'center', color:C.muted, fontSize:13 }}>
                      {t('noRecords')}<br/>
                      <span style={{ fontSize:12 }}>Click "{t('growthEntry')}" to add the first record.</span>
                    </div>
                  ) : (
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                        <thead>
                          <tr style={{ background:C.bg }}>
                            {[`${t('date')}`,`${t('weight')} (kg)`,`${t('height')} (cm)`,'Head Circ.',`${t('weight')} Z`,`${t('height')} Z`,t('status')].map(h => (
                              <th key={h} style={{
                                padding:'10px 14px', textAlign:'left',
                                color:C.muted, fontWeight:600, fontSize:12,
                                borderBottom:`1px solid ${C.border}`,
                                whiteSpace:'nowrap',
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...growth].reverse().map((r, i) => {
                            const wz = r.weightForAgeZ;
                            const hz = r.heightForAgeZ;
                            const status = statusFromZ(wz);
                            const s = SS[status];
                            return (
                              <tr key={r._id || i}
                                style={{ background: i % 2 === 0 ? '#fff' : C.bg, transition:'background .1s' }}
                              >
                                <td style={{ padding:'10px 14px', color:C.text, fontWeight:500 }}>{fmt(r.date || r.createdAt)}</td>
                                <td style={{ padding:'10px 14px', fontWeight:700, color:C.text }}>{r.weight ?? '—'}</td>
                                <td style={{ padding:'10px 14px', color:C.text }}>{r.height ?? '—'}</td>
                                <td style={{ padding:'10px 14px', color:C.text }}>{r.headCircumference ?? '—'}</td>
                                <td style={{ padding:'10px 14px' }}>
                                  {wz != null ? (
                                    <span style={{ fontWeight:700, color: statusFromZ(wz) === 'healthy' ? '#059669' : statusFromZ(wz) === 'moderate' ? '#92400e' : '#991b1b' }}>
                                      {wz.toFixed(2)}
                                    </span>
                                  ) : '—'}
                                </td>
                                <td style={{ padding:'10px 14px' }}>
                                  {hz != null ? (
                                    <span style={{ fontWeight:700, color: statusFromZ(hz) === 'healthy' ? '#059669' : statusFromZ(hz) === 'moderate' ? '#92400e' : '#991b1b' }}>
                                      {hz.toFixed(2)}
                                    </span>
                                  ) : '—'}
                                </td>
                                <td style={{ padding:'10px 14px' }}>
                                  <span style={{
                                    padding:'3px 10px', borderRadius:99,
                                    background:s.bbg, color:s.color,
                                    fontWeight:700, fontSize:11,
                                  }}>{s.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GrowthRecords;
