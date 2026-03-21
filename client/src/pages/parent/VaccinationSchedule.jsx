import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { childAPI, vaccinationAPI } from '../../services/api';

const NAV = [['🏠 Dashboard', '/parent/dashboard'], ['👶 My Child', '/parent/child-profile'], ['💉 Vaccines', '/parent/vaccination'], ['📈 Growth', '/parent/growth'], ['🥗 Diet Plan', '/parent/diet-plan'], ['🏛️ Schemes', '/parent/schemes'], ['📋 Reports', '/parent/reports']];
const CFG = {
  done: { label: 'Completed', bg: '#dcfce7', color: '#15803d', border: '#86efac', icon: '✓' },
  due: { label: 'Due Soon', bg: '#fef3c7', color: '#92400e', border: '#fcd34d', icon: '!' },
  upcoming: { label: 'Upcoming', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', icon: '→' },
  missed: { label: 'Missed', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', icon: '×' },
  future: { label: 'Scheduled', bg: '#f3f4f6', color: '#374151', border: '#d1d5db', icon: '◷' },
};
const COLS = ['#4ade80', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa', '#34d399', '#fb923c'];

function VaccineCard({ v, i, open, toggle }) {
  const c = CFG[v.status] || CFG.upcoming;
  const due = v.status === 'due';
  return <div style={{ position: 'relative', animation: `fade .45s ease ${i * 0.05}s both` }}>
    <div style={{ background: due ? 'linear-gradient(135deg,#fffbeb,#fff8e1)' : '#fff', borderRadius: 16, border: `2px solid ${due ? '#fcd34d' : c.border}`, boxShadow: due ? '0 4px 20px rgba(245,158,11,.15)' : '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
      {due && <div style={{ background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 16px', letterSpacing: '.1em', textTransform: 'uppercase', textAlign: 'center' }}>Action required</div>}
      <div style={{ padding: '18px 22px', cursor: 'pointer' }} onClick={toggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: c.bg, border: `3px solid ${c.border}`, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 18, fontWeight: 800, color: c.color }}>{c.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#0d1f14' }}>{v.ageLabel}</div>
              <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{c.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{v.items.map((x, n) => <span key={n} style={{ padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: '#f0f7f3', color: '#1a7a4a', border: '1px solid #c8e4d4' }}>{x}</span>)}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: due ? '#d97706' : v.givenDate ? '#16a34a' : '#7a9e88' }}>{v.givenDate ? `Given: ${v.givenDate}` : `Due: ${v.dueDate}`}</div>
            <div style={{ fontSize: 11, color: '#7a9e88', marginTop: 2 }}>{v.givenBy ? `by ${v.givenBy}` : v.centre || ''}</div>
            <div style={{ fontSize: 12, color: '#9ab8a4', marginTop: 4 }}>{open ? '▲ Less' : '▼ Details'}</div>
          </div>
        </div>
      </div>
      {open && <div style={{ borderTop: `1px solid ${due ? '#fcd34d' : '#e8f0ea'}`, padding: '16px 22px', background: due ? 'rgba(254,243,199,.4)' : 'rgba(240,247,243,.5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
          {[['Scheduled Date', v.dueDate || '-'], ['Given Date', v.givenDate || 'Not yet given'], ['Administered by', v.givenBy || 'Pending'], ['Centre', v.centre || 'To be decided'], ['Status', c.label], ['Child age', v.ageLabel]].map(([l, val]) => <div key={l} style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #e2ead6' }}><div style={{ fontSize: 10, fontWeight: 600, color: '#7a9e88', marginBottom: 4 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 700, color: '#0d1f14' }}>{val}</div></div>)}
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2ead6', fontSize: 13, color: '#374a3e', lineHeight: 1.65 }}><span style={{ fontWeight: 700, color: '#1a7a4a' }}>Notes: </span>{v.notes}</div>
      </div>}
    </div>
  </div>;
}

export default function VaccinationSchedule() {
  const [children, setChildren] = useState([]), [selectedChild, setSelectedChild] = useState(null), [vaccines, setVaccines] = useState([]), [loading, setLoading] = useState(true), [filter, setFilter] = useState('all'), [expanded, setExpanded] = useState({});
  useEffect(() => { childAPI.list().then((r) => { setChildren(r.data); if (r.data[0]) setSelectedChild(r.data[0]); }).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (!selectedChild) return; setLoading(true); vaccinationAPI.getSchedule(selectedChild._id).then((r) => { setVaccines(r.data); const firstDue = r.data.find((x) => x.status === 'due'); setExpanded(firstDue ? { [firstDue._id]: true } : {}); }).catch(console.error).finally(() => setLoading(false)); }, [selectedChild]);

  const mapped = useMemo(() => vaccines.map((v, idx) => ({ ...v, ageLabel: v.ageMonths ? `${v.ageMonths} Months` : `Dose ${idx + 1}`, items: [v.vaccineName], dueDate: fmt(v.dueDate), givenDate: v.givenDate ? fmt(v.givenDate) : null, givenBy: v.givenBy || null, centre: v.centre || null, notes: v.notes || 'Vaccination record available in the system.' })), [vaccines]);
  const filtered = filter === 'all' ? mapped : mapped.filter((v) => v.status === filter);
  const done = mapped.filter((v) => v.status === 'done' || v.status === 'completed').length;
  const due = mapped.filter((v) => v.status === 'due').length;
  const upcoming = mapped.filter((v) => v.status === 'upcoming').length;
  const total = mapped.length || 1;
  const pct = Math.round((done / total) * 100);

  return <div style={{ fontFamily: "'Nunito',sans-serif", background: '#f0f7f3', minHeight: '100vh', overflowX: 'hidden' }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito:wght@300;400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0} @keyframes fade{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
      .wrap{max-width:1200px;margin:0 auto;padding:20px 32px 60px}.grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.main{display:grid;grid-template-columns:1fr 340px;gap:24px}
      @media(max-width:1100px){.grid5{grid-template-columns:repeat(2,1fr)}.main{grid-template-columns:1fr}} @media(max-width:860px){.navlinks{display:none!important}.hero{flex-direction:column!important;align-items:flex-start!important}} @media(max-width:640px){.wrap{padding:20px 16px 60px}.grid5{grid-template-columns:1fr}}
    `}</style>
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0d4a2e', display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', height: 64, boxShadow: '0 2px 20px rgba(0,0,0,.3)' }}>
      <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}><div style={{ width: 38, height: 38, background: 'rgba(255,255,255,.13)', border: '1.5px solid rgba(255,255,255,.24)', borderRadius: 10, display: 'grid', placeItems: 'center' }}>🌿</div><div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>Sishu Arogaya</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.48)' }}>Child Health Portal</div></div></Link>
      <div className="navlinks" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>{NAV.map(([l, to]) => <Link key={to} to={to} style={{ padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', background: to === '/parent/vaccination' ? 'rgba(247,201,72,.2)' : 'transparent', color: to === '/parent/vaccination' ? '#f7c948' : 'rgba(255,255,255,.65)' }}>{l}</Link>)}</div>
    </nav>

    <div style={{ background: 'linear-gradient(135deg,#0a3520 0%,#145c38 50%,#1e8050 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '36px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 28 }}><Link to="/parent/dashboard" style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>🏠 Dashboard</Link><span>›</span><Link to="/parent/child-profile" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>👶 My Child</Link><span>›</span><span style={{ color: '#f7c948', fontWeight: 600 }}>💉 Vaccination Schedule</span></div>
        <div className="hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', paddingBottom: 32 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(247,201,72,.15)', border: '1px solid rgba(247,201,72,.35)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#f7c948', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>{selectedChild?.name || 'Child'} vaccination tracker</div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(26px,3vw,42px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 10 }}>Vaccination <br /><span style={{ color: '#f7c948' }}>Schedule</span></h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.65)', maxWidth: 460, lineHeight: 1.7 }}>Complete immunization tracker with reminders, due doses, and recorded vaccine history.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 130, height: 130 }}><svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}><circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="12" /><circle cx="65" cy="65" r="52" fill="none" stroke="#f7c948" strokeWidth="12" strokeDasharray="327" strokeDashoffset={327 - (pct / 100) * 327} strokeLinecap="round" /></svg><div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{pct}%</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.05em', marginTop: 3 }}>DONE</div></div></div></div>
            {children.length > 1 ? <select className="form-select" style={{ minWidth: 200 }} value={selectedChild?._id} onChange={(e) => setSelectedChild(children.find((c) => c._id === e.target.value))}>{children.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select> : null}
          </div>
        </div>
      </div>
      <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', marginTop: -1 }}><path d="M0,28 C360,56 1080,0 1440,28 L1440,48 L0,48 Z" fill="#f0f7f3" /></svg>
    </div>

    <div className="wrap">
      <div className="grid5" style={{ marginBottom: 28 }}>{[['✅', String(done), 'Completed', '#16a34a', '#dcfce7'], ['⏰', String(due), 'Due Soon', '#d97706', '#fef3c7'], ['📅', String(upcoming), 'Upcoming', '#2563eb', '#dbeafe'], ['💉', `${done}/${mapped.length || 0}`, 'Total Done', '#7c3aed', '#ede9fe'], ['📊', `${pct}%`, 'Coverage', '#0d4a2e', '#d6f0e0']].map(([icon, val, lbl, color, bg]) => <div key={lbl} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #ddeae0', boxShadow: '0 2px 8px rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 20, background: bg }}>{icon}</div><div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{val}</div><div style={{ fontSize: 11, color: '#7a9e88', marginTop: 3 }}>{lbl}</div></div></div>)}</div>
      <div className="main">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, background: '#fff', borderRadius: 12, padding: 5, border: '1px solid #ddeae0', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>{[['all', 'All Doses'], ['done', 'Completed'], ['due', 'Due'], ['upcoming', 'Upcoming'], ['missed', 'Missed']].map(([val, lbl]) => <button key={val} onClick={() => setFilter(val)} style={{ padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: filter === val ? 'linear-gradient(135deg,#1a7a4a,#0d4a2e)' : 'transparent', color: filter === val ? '#fff' : '#5a7a64' }}>{lbl}</button>)}</div>
          </div>
          {loading ? <div className="text-center py-5"><div className="spinner-border text-success" /></div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{filtered.map((v, i) => <VaccineCard key={v._id} v={v} i={i} open={!!expanded[v._id]} toggle={() => setExpanded((p) => ({ ...p, [v._id]: !p[v._id] }))} />)}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: 'linear-gradient(135deg,#92400e,#b45309)', borderRadius: 16, padding: 20, boxShadow: '0 8px 24px rgba(146,64,14,.25)' }}><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Action Required</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{mapped.find((v) => v.status === 'due')?.items[0] || 'No due vaccine'}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginBottom: 14 }}>{mapped.find((v) => v.status === 'due') ? `Due by ${mapped.find((v) => v.status === 'due').dueDate}` : 'All doses are currently up to date.'}</div></div>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ddeae0', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: 18 }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: '#0d1f14', marginBottom: 14 }}>Vaccine Key</div>{['BCG','DPT','OPV','MMR','Hib','PCV','IPV','Rota'].map((abbr, i) => <div key={abbr} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}><span style={{ width: 36, padding: '3px 0', textAlign: 'center', borderRadius: 7, background: `${COLS[i % COLS.length]}22`, color: COLS[i % COLS.length], fontSize: 11, fontWeight: 800, border: `1px solid ${COLS[i % COLS.length]}44` }}>{abbr}</span><span style={{ fontSize: 12, color: '#374a3e' }}>{abbr} vaccine reference</span></div>)}</div>
          <div style={{ background: 'linear-gradient(135deg,#f0faf5,#e8f8ef)', borderRadius: 16, border: '1px solid #9fdfc0', padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: '#0d4a2e', marginBottom: 12 }}>Tips</div>{['Never delay vaccines when a dose is due.', 'Mild fever after vaccination can be normal.', 'Keep vaccine records updated after each visit.', 'Use reminders to stay on schedule.'].map((tip, i) => <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2eb872', flexShrink: 0, marginTop: 5 }} /><div style={{ fontSize: 12, color: '#1a5c35', lineHeight: 1.6 }}>{tip}</div></div>)}</div>
        </div>
      </div>
    </div>
    <div style={{ background: '#0d4a2e', color: 'rgba(255,255,255,.45)', textAlign: 'center', padding: '16px 20px', fontSize: 12 }}>Sishu Arogaya © 2026 · Government Integrated Child Health Monitoring System · Dev Bhoomi Uttrakhand University</div>
  </div>;
}

function fmt(d) { const x = new Date(d); return Number.isNaN(x.getTime()) ? 'TBD' : x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
