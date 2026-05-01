import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { childAPI, growthAPI } from '../../services/api';
import MediaCarousel, { MEDIA_ARRAY } from '../../components/MediaCarousel';
import GrowthLineChart from '../../components/GrowthLineChart';
import { useLanguage } from '../../context/LanguageContext';

// navLinks moved to component body using useLanguage()

const WHO_W = [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.1, 10.3, 10.4, 10.6];
const WHO_H = [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3];



const TIPS = [
  ['🥦', 'Iron-rich foods', 'Dal, spinach, fortified cereals, and egg yolk support healthy growth.'],
  ['🥛', 'Dairy daily', 'Milk, curd, or paneer help with calcium and bone development.'],
  ['💧', 'Hydration', 'Offer water regularly between meals and avoid sugary drinks.'],
  ['🌞', 'Sun exposure', 'Morning sunlight supports Vitamin D and stronger bones.'],
  ['😴', 'Sleep', 'Consistent sleep helps growth hormone release.'],
  ['🧠', 'Stimulation', 'Talk, play, and read to support brain development.'],
];

function fmt(d) {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? 'N/A' : x.toLocaleDateString('en-IN');
}


function ZGauge({ value, label }) {
  const pct = Math.max(0, Math.min(100, ((value + 3) / 6) * 100));
  const color = value >= -1 ? '#059669' : value >= -2 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: '#0c2340' }}>{label}</span>
        <span style={{ fontWeight: 800, color, fontFamily: "'Libre Baskerville',serif", fontSize: 15 }}>{value?.toFixed(1) ?? '-'}</span>
      </div>
      <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', position: 'relative', background: 'linear-gradient(90deg,#fca5a5,#ef4444 20%,#fcd34d 35%,#86efac 50%,#6ee7b7 65%,#fcd34d 80%,#fca5a5)' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 2, background: '#0c2340', left: `calc(${pct}% - 1.5px)` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a7a8a', marginTop: 4 }}>
        <span>-3 Severe</span><span>-1</span><span>0 Median</span><span>+3</span>
      </div>
    </div>
  );
}

function BarChart({ data, who, keyName, gradientFrom, gradientTo, max, title }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#4a7a8a', marginBottom: 12 }}>
        <span>{title}</span>
        <span style={{ color: '#f59e0b' }}>— WHO median</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, position: 'relative' }}>
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <div key={p} style={{ position: 'absolute', left: 0, right: 0, bottom: `${p * 100}%`, height: 1, background: 'rgba(8,145,178,.08)' }} />
        ))}
        {data.map((d, i) => {
          const val = Number(d[keyName] || 0);
          const whoVal = who[Math.min(d.ageMonths || 0, who.length - 1)] || 0;
          const isLatest = i === data.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: isLatest ? '#0891b2' : '#94a3b8' }}>{val}</div>
              <div style={{ position: 'absolute', bottom: `${(whoVal / max) * 100}%`, left: '5%', right: '5%', height: 2, background: '#f59e0b', borderRadius: 1, zIndex: 2 }} />
              <div style={{
                width: '70%',
                height: `${(val / max) * 100}%`,
                minHeight: 4,
                borderRadius: '4px 4px 0 0',
                background: isLatest ? `linear-gradient(180deg,${gradientFrom},${gradientTo})` : `${gradientTo}44`,
                border: isLatest ? `2px solid ${gradientTo}` : 'none',
              }} />
              <div style={{ fontSize: 9, color: isLatest ? '#0891b2' : '#94a3b8', fontWeight: isLatest ? 700 : 500 }}>{d.ageMonths}m</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GrowthMonitoring() {
  const { navLinks, t } = useLanguage();
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('weight');
  const [slide, setSlide] = useState(0);

  // ── Record Growth form ──
  const [showForm,   setShowForm]   = useState(false);
  const [formData,   setFormData]   = useState({ weight: '', height: '', headCircumference: '', notes: '' });
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');

  const calcAgeMonthsNow = (dob) => {
    if (!dob) return 0;
    const ms = Date.now() - new Date(dob).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44));
  };

  const getMaxWeight = () => {
    if (!selected) return 14;
    return selected.gender === 'female' ? 13 : 14;
  };

  const isWeightInvalid = formData.weight && parseFloat(formData.weight) > getMaxWeight();

  const handleSaveGrowth = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!formData.weight && !formData.height) { setSaveMsg('⚠️ Enter at least weight or height.'); return; }
    if (isWeightInvalid) {
      setSaveMsg(`⚠️ Invalid: Weight exceeds max ${getMaxWeight()} kg for ${selected.gender === 'female' ? 'girls' : 'boys'}.`);
      return;
    }
    setSaving(true);
    setSaveMsg('');
    try {
      await growthAPI.add({
        childId: selected._id,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        headCircumference: formData.headCircumference ? parseFloat(formData.headCircumference) : undefined,
        ageMonths: calcAgeMonthsNow(selected.dob) || selected.ageInMonths || 0,
        notes: formData.notes,
      });
      setSaveMsg('✅ Growth record saved!');
      setFormData({ weight: '', height: '', headCircumference: '', notes: '' });
      // Refresh data
      const [h, p] = await Promise.all([
        growthAPI.getHistory(selected._id),
        growthAPI.getPrediction(selected._id).catch(() => ({ data: null })),
      ]);
      setRecords(h.data);
      setPrediction(p.data);
      setTimeout(() => { setSaveMsg(''); setShowForm(false); }, 2000);
    } catch (err) {
      setSaveMsg(`⚠️ ${err.response?.data?.message || 'Failed to save. Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    childAPI.list().then((r) => {
      setChildren(r.data);
      if (r.data[0]) setSelected(r.data[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    Promise.all([
      growthAPI.getHistory(selected._id),
      growthAPI.getPrediction(selected._id).catch(() => ({ data: null })),
    ]).then(([h, p]) => {
      setRecords(h.data);
      setPrediction(p.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [selected]);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % MEDIA_ARRAY.length), 4000);
    return () => clearInterval(t);
  }, []);

  const data = useMemo(() => records.map((r) => ({ ...r, label: `${r.ageMonths}m` })), [records]);
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const wGain = latest && prev ? (latest.weight - prev.weight).toFixed(1) : null;
  const hGain = latest && prev ? (latest.height - prev.height).toFixed(1) : null;
  const statusText = prediction?.prediction || selected?.nutritionStatus || 'Normal';
  const whoW = WHO_W[Math.min(latest?.ageMonths || 0, WHO_W.length - 1)];
  const whoH = WHO_H[Math.min(latest?.ageMonths || 0, WHO_H.length - 1)];

  const TABS = [
    ['trend', '📈 Growth Trend', '#059669'],
    ['weight', '⚖️ Weight', '#0891b2'],
    ['height', '📏 Height', '#1d4ed8'],
    ['zscore', '📊 Z-Scores', '#f59e0b'],
    ['records', '📋 Records', '#0891b2'],
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#f8fffe', minHeight: '100vh', color: '#0c2340', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{margin:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sa-anim{animation:fadeUp .4s both}
        .sa-anim2{animation:fadeUp .5s .1s both}
        .sa-anim3{animation:fadeUp .5s .2s both}
        .g2{display:grid;grid-template-columns:2fr 1fr;gap:24px}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .g31{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .navlinks{display:flex;align-items:center;gap:2px;flex:1}
        .tab-btn{flex:1;padding:13px 8px;border:none;background:transparent;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;transition:color .2s}
        .tab-btn:hover{opacity:.85}
        .p-ok{background:#ecfdf5;color:#059669;border:1px solid #6ee7b7;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700}
        .p-warn{background:#fffbeb;color:#f59e0b;border:1px solid #fcd34d;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700}
        .p-bad{background:#fef2f2;color:#ef4444;border:1px solid #fca5a5;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700}
        @media(max-width:768px){
          .navlinks{display:none!important}
          .g2,.g31,.g3{grid-template-columns:1fr!important}
          .g4{grid-template-columns:1fr 1fr!important}
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', height: 64, borderBottom: '2px solid #cffafe', boxShadow: '0 2px 16px rgba(8,145,178,.1)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px' }}>
        <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: 20 }}>🏥</div>
          <div>
            <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 17, fontWeight: 700, color: '#0e7490', lineHeight: 1.1 }}>Shishu Aarogya</div>
            <div style={{ fontSize: 10, color: '#4a7a8a', lineHeight: 1.2 }}>National Child Health Portal</div>
          </div>
        </Link>

        <div className="navlinks">
          {(navLinks && navLinks.length ? navLinks : NAV).map(([label, to]) => (
            <Link key={to} to={to} style={{
              padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all .18s',
              background: to === '/parent/growth' ? '#f0fdff' : 'transparent',
              color: to === '/parent/growth' ? '#0e7490' : '#4a7a8a',
              fontFamily: "'DM Sans',sans-serif",
            }}>{label}</Link>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#4a7a8a', padding: 4 }}>🔔</button>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#0891b2,#0e7490)', display: 'grid', placeItems: 'center', fontSize: 15 }}>👤</div>
        </div>
      </nav>

      {/* HERO CAROUSEL */}
      <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
        <MediaCarousel currentSlideIndex={slide} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg,rgba(8,145,178,.92),rgba(14,116,144,.6),rgba(8,145,178,.8))' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#cffafe', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14, width: 'fit-content' }}>🏥 Growth Monitoring</div>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 10 }}>
            Growth <span style={{ color: '#5eead4' }}>Monitoring</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', maxWidth: 420, lineHeight: 1.7 }}>
            WHO z-score analysis and growth tracking for your child aged 0–24 months
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: 16, left: 32, display: 'flex', gap: 7, zIndex: 2 }}>
          {MEDIA_ARRAY.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 20 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: i === slide ? '#5eead4' : 'rgba(255,255,255,.45)', transition: 'all .3s', padding: 0,
            }} />
          ))}
        </div>
      </div>

      {/* PAGE HEADER */}
      <div style={{ background: '#fff', borderBottom: '1px solid #c5e8ef', padding: '14px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, fontWeight: 700, color: '#0c2340', marginBottom: 4 }}>📈 Growth Monitoring</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4a7a8a' }}>
              <Link to="/parent/dashboard" style={{ color: '#4a7a8a', textDecoration: 'none' }}>Dashboard</Link>
              <span>›</span>
              <Link to="/parent/child-profile" style={{ color: '#4a7a8a', textDecoration: 'none' }}>My Child</Link>
              <span>›</span>
              <span style={{ color: '#0891b2', fontWeight: 600 }}>{selected?.name || 'Growth Monitoring'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowForm(true)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
            >📏 Record Growth</button>
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ maxWidth: 1200, margin: '24px auto 0', padding: '0 32px' }}>
        <div className="g4 sa-anim">
          {[
            ['⚖️', 'Current Weight', latest?.weight != null ? `${latest.weight} kg` : '—', '#0891b2', '#f0fdff', '#c5e8ef', wGain != null ? `+${wGain} kg since last` : 'No prior record'],
            ['📏', 'Current Height', latest?.height != null ? `${latest.height} cm` : '—', '#059669', '#f0fdf4', '#bbf7d0', hGain != null ? `+${hGain} cm since last` : 'No prior record'],
            ['📊', 'WAZ Score', prediction?.waz != null ? prediction.waz.toFixed(1) : (latest?.wazScore != null ? latest.wazScore.toFixed(1) : '—'), '#f59e0b', '#fffbeb', '#fde68a', prediction?.wazStatus || 'Weight for age'],
            ['🏥', 'Health Status', statusText, '#1d4ed8', '#eff6ff', '#bfdbfe', prediction?.advice ? prediction.advice.slice(0, 40) + '…' : 'Based on latest record'],
          ].map(([icon, label, value, color, bg, border, sub]) => (
            <div key={label} style={{ background: bg, border: `2px solid ${border}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 10px rgba(8,145,178,.07)' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 24, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#4a7a8a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 11, color: '#4a7a8a' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1200, margin: '24px auto 0', padding: '0 32px 60px' }}>
        <div className="g2">
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* TABS CARD */}
            <div className="sa-anim" style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #c5e8ef', boxShadow: '0 4px 18px rgba(8,145,178,.08)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #c5e8ef', background: '#f0fdff' }}>
                {TABS.map(([id, label, color]) => (
                  <button key={id} className="tab-btn" onClick={() => setTab(id)} style={{
                    color: tab === id ? color : '#4a7a8a',
                    borderBottom: tab === id ? `3px solid ${color}` : '3px solid transparent',
                    marginBottom: -2,
                  }}>{label}</button>
                ))}
              </div>
              <div style={{ padding: 24 }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}>
                    <div style={{ width: 36, height: 36, border: '4px solid #c5e8ef', borderTopColor: '#0891b2', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                  </div>
                ) : tab === 'trend' ? (
                  <div>
                    {data.length > 0 ? (
                      <div>
                        <div style={{ marginBottom: 24 }}>
                          <GrowthLineChart data={data} type="weight" maxAge={24} />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                          <GrowthLineChart data={data} type="height" maxAge={24} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#4a7a8a' }}>No growth records available. Start by recording your baby's measurements!</div>
                    )}
                  </div>
                ) : tab === 'weight' ? (
                  <>
                    {data.length > 0
                      ? <BarChart data={data} who={WHO_W} keyName="weight" gradientFrom="#5eead4" gradientTo="#0891b2" max={14} title="Weight (kg) vs WHO median" />
                      : <div style={{ textAlign: 'center', padding: '32px 0', color: '#4a7a8a' }}>No growth records available.</div>
                    }
                    <div style={{ marginTop: 20, padding: '14px 16px', background: '#f0fdff', borderRadius: 10, border: '1px solid #c5e8ef', fontSize: 13, color: '#0c2340', lineHeight: 1.7 }}>
                      <strong style={{ color: '#0891b2' }}>Weight insight:</strong> Current weight records show <strong>{latest?.weight ?? '—'} kg</strong>. WHO median for {latest?.ageMonths ?? 0} months is <strong>{whoW} kg</strong>. Continue balanced meals and monthly growth checks.
                    </div>
                  </>
                ) : tab === 'height' ? (
                  <>
                    {data.length > 0
                      ? <BarChart data={data} who={WHO_H} keyName="height" gradientFrom="#93c5fd" gradientTo="#1d4ed8" max={95} title="Height (cm) vs WHO median" />
                      : <div style={{ textAlign: 'center', padding: '32px 0', color: '#4a7a8a' }}>No growth records available.</div>
                    }
                    <div style={{ marginTop: 20, padding: '14px 16px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', fontSize: 13, color: '#0c2340', lineHeight: 1.7 }}>
                      <strong style={{ color: '#1d4ed8' }}>Height insight:</strong> Current height records show <strong>{latest?.height ?? '—'} cm</strong>. WHO median for {latest?.ageMonths ?? 0} months is <strong>{whoH} cm</strong>. Sleep, nutrition, and follow-up checks remain important.
                    </div>
                  </>
                ) : tab === 'zscore' ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0c2340', marginBottom: 20, fontFamily: "'Libre Baskerville',serif" }}>WHO Z-Score Gauges</div>
                    <ZGauge value={prediction?.waz ?? latest?.wazScore ?? 0} label="Weight for Age (WAZ)" />
                    <ZGauge value={prediction?.haz ?? latest?.hazScore ?? 0} label="Height for Age (HAZ)" />
                    <ZGauge value={prediction?.whz ?? latest?.whzScore ?? 0} label="Weight for Height (WHZ)" />
                    <div style={{ marginTop: 16, padding: '12px 14px', background: '#f0fdff', borderRadius: 10, border: '1px solid #c5e8ef', fontSize: 12, color: '#4a7a8a', lineHeight: 1.7 }}>
                      Z-scores compare your child's measurements to the WHO global median. A score between -2 and +2 is considered normal.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f0fdff' }}>
                          {['Date', 'Age (mo)', 'Weight', 'Height', 'WAZ', 'HAZ', 'Status'].map((h) => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#4a7a8a', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '2px solid #c5e8ef' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.length ? data.map((r, i) => {
                          const s = (r.prediction || '').toLowerCase();
                          const cls = s.includes('severe') || s.includes('sam') ? 'p-bad' : s.includes('moderate') || s.includes('mam') ? 'p-warn' : 'p-ok';
                          return (
                            <tr key={r._id || i} style={{ borderBottom: '1px solid #c5e8ef', background: i % 2 === 0 ? '#fff' : '#f0fdff' }}>
                              <td style={{ padding: '11px 12px' }}>{fmt(r.recordedDate)}</td>
                              <td style={{ padding: '11px 12px' }}>{r.ageMonths}</td>
                              <td style={{ padding: '11px 12px', fontWeight: 600 }}>{r.weight} kg</td>
                              <td style={{ padding: '11px 12px', fontWeight: 600 }}>{r.height} cm</td>
                              <td style={{ padding: '11px 12px' }}>{r.wazScore?.toFixed(1) ?? '-'}</td>
                              <td style={{ padding: '11px 12px' }}>{r.hazScore?.toFixed(1) ?? '-'}</td>
                              <td style={{ padding: '11px 12px' }}><span className={cls}>{r.prediction || 'Recorded'}</span></td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: '#4a7a8a' }}>No growth records available.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* TIPS SECTION */}
            <div className="sa-anim2">
              <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: '#0c2340', marginBottom: 14 }}>Tips to Support Growth</h3>
              <div className="g3">
                {TIPS.map(([icon, title, desc]) => (
                  <div key={title} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #c5e8ef', padding: 16, boxShadow: '0 2px 8px rgba(8,145,178,.07)' }}>
                    <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0c2340', marginBottom: 5 }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#4a7a8a', lineHeight: 1.65 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Child Selector */}
            <div className="sa-anim" style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 16, padding: 20, boxShadow: '0 6px 20px rgba(8,145,178,.25)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Selected Child</div>
              <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{selected?.name || 'No child selected'}</div>
              {selected && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: children.length > 1 ? 14 : 0 }}>
                  {selected.ageInMonths ?? 0} months old
                </div>
              )}
              {children.length > 1 && (
                <select
                  value={selected?._id || ''}
                  onChange={(e) => setSelected(children.find((c) => c._id === e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', outline: 'none' }}
                >
                  {children.map((c) => <option key={c._id} value={c._id} style={{ color: '#0c2340' }}>{c.name}</option>)}
                </select>
              )}
            </div>

            {/* What the numbers mean */}
            <div className="sa-anim2" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #c5e8ef', boxShadow: '0 2px 10px rgba(8,145,178,.07)', overflow: 'hidden' }}>
              <div style={{ background: '#f0fdff', padding: '12px 18px', borderBottom: '2px solid #c5e8ef' }}>
                <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 14, fontWeight: 700, color: '#0e7490' }}>What the numbers mean</div>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['WAZ', prediction?.waz ?? latest?.wazScore, prediction?.wazStatus || 'Weight for Age', 'Compares your child\'s weight to peers of the same age globally.'],
                  ['HAZ', prediction?.haz ?? latest?.hazScore, prediction?.hazStatus || 'Height for Age', 'Reflects long-term nutritional history and linear growth.'],
                  ['WHZ', prediction?.whz ?? latest?.whzScore, prediction?.whzStatus || 'Weight for Height', 'Indicates current nutritional status — acute wasting indicator.'],
                ].map(([label, val, status, desc]) => {
                  const v = typeof val === 'number' ? val : null;
                  const color = v == null ? '#0891b2' : v >= -1 ? '#059669' : v >= -2 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={label} style={{ background: '#f0fdff', borderRadius: 10, padding: '12px 14px', border: '1px solid #c5e8ef' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0c2340' }}>{label}</div>
                        <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 18, fontWeight: 700, color }}>{v != null ? v.toFixed(1) : '—'}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 3 }}>{status}</div>
                      <div style={{ fontSize: 11, color: '#4a7a8a', lineHeight: 1.55 }}>{desc}</div>
                    </div>
                  );
                })}
                {prediction?.advice && (
                  <div style={{ background: '#ecfdf5', borderRadius: 10, padding: '12px 14px', border: '1px solid #bbf7d0', fontSize: 12, color: '#065f46', lineHeight: 1.6 }}>
                    <strong>Advice:</strong> {prediction.advice}
                  </div>
                )}
              </div>
            </div>

            {/* WHO Reference Table */}
            <div className="sa-anim3" style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #c5e8ef', boxShadow: '0 2px 10px rgba(8,145,178,.07)', overflow: 'hidden' }}>
              <div style={{ background: '#f0fdff', padding: '12px 18px', borderBottom: '2px solid #c5e8ef' }}>
                <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 14, fontWeight: 700, color: '#0e7490' }}>WHO Reference</div>
                {latest?.ageMonths != null && <div style={{ fontSize: 11, color: '#4a7a8a', marginTop: 2 }}>Age: {latest.ageMonths} months</div>}
              </div>
              <div style={{ padding: '8px 16px 16px' }}>
                {[
                  ['Median Weight', `${whoW} kg`],
                  ['Median Height', `${whoH} cm`],
                  ['Current Weight', latest?.weight != null ? `${latest.weight} kg` : '—'],
                  ['Current Height', latest?.height != null ? `${latest.height} cm` : '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #c5e8ef' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#4a7a8a' }}>{label}</div>
                    <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: '#0891b2' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECORD GROWTH MODAL */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(12, 35, 64, 0.6)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div className="sa-anim" style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 460, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', padding: '24px 32px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, fontWeight: 700 }}>Record Growth</h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Capture your child's current metrics.</p>
            </div>
            <form onSubmit={handleSaveGrowth} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="g31">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4a7a8a', marginBottom: 8 }}>Weight (kg)</label>
                  <input type="number" step="0.01" className="pretty-input" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: isWeightInvalid ? '2px solid #ef4444' : '1.5px solid #c5e8ef', outline: 'none', background: isWeightInvalid ? '#fef2f2' : '#f0fdff', color: '#0c2340', fontWeight: 600 }} placeholder="e.g. 8.5" />
                  {isWeightInvalid && (
                    <div style={{ marginTop: 6, padding: '6px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                      ❌ Invalid: Max weight for {selected?.gender === 'female' ? 'girls' : 'boys'} is {getMaxWeight()} kg
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4a7a8a', marginBottom: 8 }}>Height (cm)</label>
                  <input type="number" step="0.1" className="pretty-input" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #c5e8ef', outline: 'none', background: '#f0fdff', color: '#0c2340', fontWeight: 600 }} placeholder="e.g. 72.0" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4a7a8a', marginBottom: 8 }}>Head Circumference (cm) - Optional</label>
                <input type="number" step="0.1" className="pretty-input" value={formData.headCircumference} onChange={(e) => setFormData({ ...formData, headCircumference: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #c5e8ef', outline: 'none', background: '#f0fdff', color: '#0c2340', fontWeight: 600 }} placeholder="e.g. 44.5" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4a7a8a', marginBottom: 8 }}>Notes</label>
                <textarea className="pretty-input" rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #c5e8ef', outline: 'none', background: '#f0fdff', color: '#0c2340', fontFamily: 'inherit', resize: 'none' }} placeholder="Any observations..."></textarea>
              </div>
              {saveMsg && <div style={{ fontSize: 13, fontWeight: 600, color: saveMsg.includes('✅') ? '#059669' : '#ef4444', textAlign: 'center' }}>{saveMsg}</div>}
              <button disabled={saving} type="submit" style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: saving ? '#4a7a8a' : 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8 }}>
                {saving ? 'Saving...' : '💾 Save Record'}
              </button>
            </form>
          </div>
        </div>
      )}
      <footer style={{ background: '#0e7490', color: 'rgba(255,255,255,.45)', textAlign: 'center', padding: 14, fontSize: 12 }}>
        Shishu Aarogya &copy; 2024 &middot; {t('homeFooter_copyright_long') || 'National Child Health Portal · Government of India'}
      </footer>
    </div>
  );
}
