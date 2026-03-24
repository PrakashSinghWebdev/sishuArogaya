import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { childAPI, vaccinationAPI } from '../../services/api';

function printVaccineCard(child, vaccines) {
  const done = vaccines.filter(v => v.status === 'done' || v.status === 'completed');
  const win = window.open('', '_blank', 'width=700,height=900');
  win.document.write(`
    <html><head><title>Vaccine Card — ${child?.name || 'Child'}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#0c2340}
      h1{color:#0e7490;margin-bottom:4px}
      h2{color:#0891b2;font-size:14px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th{background:#0891b2;color:#fff;padding:8px 12px;text-align:left;font-size:12px}
      td{padding:8px 12px;border-bottom:1px solid #c5e8ef;font-size:13px}
      tr:nth-child(even)td{background:#f0fdff}
      .footer{margin-top:20px;font-size:11px;color:#4a7a8a;text-align:center;border-top:1px solid #c5e8ef;padding-top:12px}
    </style></head><body>
    <h1>🏥 Sishu Arogaya</h1>
    <h2>Government Integrated Child Health Monitoring System — DBUU Dehradun</h2>
    <p><strong>Child Name:</strong> ${child?.name || '—'} &nbsp;|&nbsp; <strong>DOB:</strong> ${child?.dob ? new Date(child.dob).toLocaleDateString('en-IN') : '—'} &nbsp;|&nbsp; <strong>Gender:</strong> ${child?.gender || '—'}</p>
    <table>
      <thead><tr><th>#</th><th>Vaccine</th><th>Age (months)</th><th>Date Given</th><th>Status</th></tr></thead>
      <tbody>${done.map((v, i) => `<tr><td>${i + 1}</td><td>${v.vaccineName}</td><td>${v.ageMonths ?? '—'}</td><td>${v.givenDate ? new Date(v.givenDate).toLocaleDateString('en-IN') : v.dueDate ? new Date(v.dueDate).toLocaleDateString('en-IN') : '—'}</td><td>✓ Done</td></tr>`).join('')}</tbody>
    </table>
    <div class="footer">Printed on ${new Date().toLocaleDateString('en-IN')} &nbsp;·&nbsp; Sishu Arogaya © 2024</div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

const C = {
  teal: '#0891b2', teal2: '#0e7490', teal3: '#cffafe', teal4: '#f0fdff',
  bg: '#f8fffe', text: '#0c2340', muted: '#4a7a8a', border: '#c5e8ef',
};

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
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1400&q=80&fit=crop',
];

const STATUS_CFG = {
  done:     { label: 'Done',     bg: '#dcfce7', color: '#15803d', border: '#86efac', icon: '✓', pillBg: '#dcfce7', pillColor: '#15803d' },
  due:      { label: 'Due Soon', bg: '#fef3c7', color: '#92400e', border: '#fcd34d', icon: '!', pillBg: '#fef3c7', pillColor: '#b45309' },
  upcoming: { label: 'Upcoming', bg: C.teal4,   color: C.teal2,   border: C.border,  icon: '→', pillBg: C.teal4,   pillColor: C.teal },
  missed:   { label: 'Missed',   bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', icon: '×', pillBg: '#fee2e2', pillColor: '#b91c1c' },
};

function fmt(d) {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? 'TBD' : x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function VaccineRow({ v, idx }) {
  const cfg = STATUS_CFG[v.status] || STATUS_CFG.upcoming;
  const isDue = v.status === 'due';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: isDue ? '#fffbeb' : '#fff',
      border: `1.5px solid ${isDue ? '#fcd34d' : C.border}`,
      borderRadius: 12,
      marginBottom: 10,
      boxShadow: isDue ? '0 2px 12px rgba(245,158,11,.12)' : '0 1px 4px rgba(8,145,178,.05)',
      animation: `fadeUp .4s ease ${idx * 0.04}s both`,
    }}>
      {/* Status circle */}
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        background: cfg.bg, border: `2.5px solid ${cfg.border}`,
        display: 'grid', placeItems: 'center',
        fontSize: 18, fontWeight: 800, color: cfg.color, flexShrink: 0,
      }}>{cfg.icon}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{v.vaccineName}</div>
        <div style={{ fontSize: 11, color: C.muted }}>
          {v.givenDate ? `Given: ${fmt(v.givenDate)}` : `Due: ${fmt(v.dueDate)}`}
          {v.centre ? ` · ${v.centre}` : ''}
        </div>
      </div>

      {/* Age label */}
      <div style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginRight: 6 }}>
        {v.ageMonths != null ? `${v.ageMonths} mo` : ''}
      </div>

      {/* Pill */}
      <span style={{
        padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
        background: cfg.pillBg, color: cfg.pillColor, border: `1px solid ${cfg.border}`,
        flexShrink: 0,
      }}>{cfg.label}</span>
    </div>
  );
}

export default function VaccinationSchedule() {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [slide, setSlide] = useState(0);
  const [reminderMsg, setReminderMsg] = useState('');

  const handleSetReminder = (vaccine) => {
    const key = `sa_reminder_${vaccine?._id || 'vaccine'}`;
    const name = vaccine?.vaccineName || 'Vaccine';
    const due = vaccine?.dueDate ? new Date(vaccine.dueDate).toLocaleDateString('en-IN') : 'upcoming';
    localStorage.setItem(key, JSON.stringify({ vaccine: name, dueDate: due, set: new Date().toISOString() }));
    setReminderMsg(`✓ Reminder set for ${name} (due ${due})`);
    setTimeout(() => setReminderMsg(''), 4000);
  };

  const handleBookAppointment = () => {
    // Navigate to notifications page; user can contact ASHA from there
    navigate('/parent/notifications');
  };

  useEffect(() => {
    childAPI.list()
      .then((r) => { setChildren(r.data); if (r.data[0]) setSelectedChild(r.data[0]); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    vaccinationAPI.getSchedule(selectedChild._id)
      .then((r) => setVaccines(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedChild]);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const done = useMemo(() => vaccines.filter((v) => v.status === 'done' || v.status === 'completed').length, [vaccines]);
  const dueCount = useMemo(() => vaccines.filter((v) => v.status === 'due').length, [vaccines]);
  const upcomingCount = useMemo(() => vaccines.filter((v) => v.status === 'upcoming').length, [vaccines]);
  const total = vaccines.length || 1;
  const pct = Math.round((done / total) * 100);
  const firstDue = useMemo(() => vaccines.find((v) => v.status === 'due'), [vaccines]);

  const filtered = filter === 'all' ? vaccines : vaccines.filter((v) => v.status === filter);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .vs-card{background:#fff;border:1.5px solid ${C.border};border-radius:16px;box-shadow:0 2px 12px rgba(8,145,178,.07);padding:20px}
        .vs-btn{padding:9px 18px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;border:none;transition:all .2s;font-family:inherit}
        .vs-btn-teal{background:${C.teal};color:#fff} .vs-btn-teal:hover{background:${C.teal2}}
        .vs-btn-out{background:#fff;color:${C.teal};border:1.5px solid ${C.border}} .vs-btn-out:hover{background:${C.teal4}}
        @media(max-width:960px){.vs-main{grid-template-columns:1fr!important}}
        @media(max-width:700px){.vs-stats{grid-template-columns:repeat(2,1fr)!important}.vs-nav-links{display:none!important}}
        @media(max-width:420px){.vs-stats{grid-template-columns:1fr!important}}
      `}</style>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', height: 62, boxShadow: '0 2px 12px rgba(8,145,178,.08)' }}>
        <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 20, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${C.teal},${C.teal2})`, borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 18 }}>🌿</div>
          <span style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 17, fontWeight: 700, color: C.teal2 }}>Sishu Arogaya</span>
        </Link>
        <div className="vs-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflowX: 'auto' }}>
          {NAV.map(([label, to]) => (
            <Link key={to} to={to} style={{ padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', background: to === '/parent/vaccination' ? C.teal4 : 'transparent', color: to === '/parent/vaccination' ? C.teal : C.muted, borderBottom: to === '/parent/vaccination' ? `2px solid ${C.teal}` : '2px solid transparent' }}>
              {label}
            </Link>
          ))}
        </div>
        {children.length > 1 && (
          <select value={selectedChild?._id || ''} onChange={(e) => setSelectedChild(children.find((c) => c._id === e.target.value))}
            style={{ marginLeft: 12, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: '#fff', fontFamily: 'inherit' }}>
            {children.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        {SLIDES.map((src, i) => (
          <img key={src} src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === slide ? 1 : 0, transition: 'opacity 1s ease' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${C.teal2}ee,${C.teal}bb)` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 14 }}>🏥 Vaccination Tracker</div>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
            Immunization <span style={{ color: C.teal3 }}>Schedule</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, marginTop: 8 }}>Track every dose, stay ahead of due vaccines</p>
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 3 }}>
          {SLIDES.map((_, i) => <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 7, height: 7, borderRadius: 4, background: i === slide ? '#fff' : 'rgba(255,255,255,.45)', cursor: 'pointer', transition: 'all .3s' }} />)}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }}>💉 Vaccination Schedule</h2>
            {selectedChild && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{selectedChild.name}</div>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="vs-btn vs-btn-teal" onClick={handleBookAppointment}>📅 Book Appointment</button>
            <button className="vs-btn vs-btn-out" onClick={() => printVaccineCard(selectedChild, vaccines)}>💳 Vaccine Card</button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="vs-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { icon: '✅', val: done,          label: 'Completed',    color: C.teal,    top: C.teal },
            { icon: '⏰', val: dueCount,      label: 'Due Soon',     color: '#d97706', top: '#f59e0b' },
            { icon: '📅', val: upcomingCount, label: 'Upcoming',     color: '#16a34a', top: '#16a34a' },
            { icon: '💉', val: `${pct}%`,     label: 'Coverage Rate',color: '#2563eb', top: '#2563eb' },
          ].map(({ icon, val, label, color, top }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${C.border}`, padding: '18px 16px', borderTop: `3px solid ${top}`, boxShadow: '0 2px 8px rgba(8,145,178,.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.teal4, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Due Alert Banner */}
        {firstDue && (
          <div style={{ background: 'linear-gradient(135deg,#fef3c7,#fff8e1)', border: '1.5px solid #fcd34d', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', animation: 'fadeUp .4s ease' }}>
            <div style={{ fontSize: 28 }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>{firstDue.vaccineName} is due!</div>
              <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Due date: {fmt(firstDue.dueDate)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="vs-btn" style={{ background: '#f59e0b', color: '#fff', fontSize: 12 }} onClick={handleBookAppointment}>📅 Book Now</button>
              <button className="vs-btn vs-btn-out" style={{ fontSize: 12 }} onClick={() => handleSetReminder(firstDue)}>🔔 Set Reminder</button>
            </div>
          </div>
        )}

        {/* Reminder confirmation toast */}
        {reminderMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#15803d', animation: 'fadeUp .3s ease' }}>
            {reminderMsg}
          </div>
        )}

        {/* Main grid */}
        <div className="vs-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22, alignItems: 'start' }}>
          {/* Left: Timeline */}
          <div className="vs-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: C.teal2, margin: 0 }}>📋 Complete Vaccine Timeline</h5>
              <div style={{ display: 'flex', gap: 6, background: C.teal4, borderRadius: 10, padding: 4 }}>
                {[['all', 'All'], ['done', 'Done'], ['due', 'Due'], ['upcoming', 'Upcoming'], ['missed', 'Missed']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilter(val)}
                    style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filter === val ? C.teal : 'transparent', color: filter === val ? '#fff' : C.muted }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #c5e8ef', borderTopColor: '#0891b2', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted, fontSize: 14 }}>No vaccines found for this filter.</div>
            ) : (
              filtered.map((v, i) => <VaccineRow key={v._id} v={v} idx={i} />)
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Vaccination Centre */}
            <div className="vs-card">
              <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 15, fontWeight: 700, color: C.teal2, marginBottom: 14 }}>🏥 Vaccination Centre</h5>
              {[
                { icon: '🏛️', label: 'Centre Name', value: selectedChild?.ashaId?.block ? `PHC – ${selectedChild.ashaId.block}` : 'Primary Health Centre' },
                { icon: '📍', label: 'Address', value: [selectedChild?.ashaId?.village, selectedChild?.ashaId?.block, selectedChild?.ashaId?.district].filter(Boolean).join(', ') || 'Block PHC, Main Road' },
                { icon: '⏰', label: 'Timings', value: 'Mon–Sat: 9 AM – 1 PM' },
                { icon: '📞', label: 'ASHA Contact', value: selectedChild?.ashaId?.userId?.phone || 'Contact your ASHA worker' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: C.teal4, borderRadius: 9, marginBottom: 7 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.teal3, display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{label}</div>
                    {label === 'ASHA Contact' && selectedChild?.ashaId?.userId?.phone
                      ? <a href={`tel:${selectedChild.ashaId.userId.phone}`} style={{ fontSize: 12, fontWeight: 700, color: C.teal, textDecoration: 'none' }}>{value}</a>
                      : <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{value}</div>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* After Vaccination Tips */}
            <div className="vs-card" style={{ background: C.teal4 }}>
              <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 15, fontWeight: 700, color: C.teal2, marginBottom: 12 }}>💡 After Vaccination Tips</h5>
              {[
                'Mild fever is normal – give paracetamol if needed',
                'Keep the injection site clean and dry',
                'Monitor child for 30 minutes after vaccination',
                'Comfort the child with breastfeeding or cuddles',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 9, padding: '8px 10px', background: '#fff', borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{tip}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 4, padding: '8px 10px', background: '#fee2e2', borderRadius: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', flexShrink: 0, marginTop: 5 }} />
                <div style={{ fontSize: 12, color: '#b91c1c', lineHeight: 1.6, fontWeight: 600 }}>Emergency: Seek care if breathing difficulty or high fever persists</div>
              </div>
            </div>

            {/* Coverage Progress */}
            <div style={{ background: `linear-gradient(135deg,${C.teal2},${C.teal})`, borderRadius: 14, padding: '20px 18px', boxShadow: `0 4px 16px rgba(8,145,178,.2)` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Coverage Progress</div>
              <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 38, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{pct}%</div>
              <div style={{ height: 8, background: 'rgba(255,255,255,.2)', borderRadius: 4, margin: '12px 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 4, transition: 'width .8s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
                <span>{done}/{vaccines.length} vaccines done</span>
                <span>Target: 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#0e7490', color: 'rgba(255,255,255,.45)', textAlign: 'center', padding: 14, fontSize: 12 }}>
        Sishu Arogaya © 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
      </div>
    </div>
  );
}
