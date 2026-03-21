import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { childAPI, growthAPI } from '../../services/api';

const NAV = [['🏠 Dashboard', '/parent/dashboard'], ['👶 My Child', '/parent/child-profile'], ['💉 Vaccines', '/parent/vaccination'], ['📈 Growth', '/parent/growth'], ['🥗 Diet Plan', '/parent/diet-plan'], ['🏛️ Schemes', '/parent/schemes'], ['📋 Reports', '/parent/reports']];
const WHO_W = [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.1, 10.3, 10.4, 10.6];
const WHO_H = [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3];
const TIPS = [['🥦', 'Iron-rich foods', 'Dal, spinach, fortified cereals, and egg yolk support healthy growth.'], ['🥛', 'Dairy daily', 'Milk, curd, or paneer help with calcium and bone development.'], ['💧', 'Hydration', 'Offer water regularly between meals and avoid sugary drinks.'], ['🌞', 'Sun exposure', 'Morning sunlight supports Vitamin D and stronger bones.'], ['😴', 'Sleep', 'Consistent sleep helps growth hormone release.'], ['🧠', 'Stimulation', 'Talk, play, and read to support brain development.']];

function BarChart({ data, who, keyName, color, max, unit, title }) {
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#7a9e88', marginBottom: 12 }}><span>{title}</span><span>WHO median shown in gold</span></div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, position: 'relative' }}>
      {[0.25, 0.5, 0.75, 1].map((p) => <div key={p} style={{ position: 'absolute', left: 0, right: 0, bottom: `${p * 100}%`, height: 1, background: 'rgba(0,0,0,.05)' }} />)}
      {data.map((d, i) => {
        const val = Number(d[keyName] || 0), whoVal = who[Math.min(d.ageMonths || 0, who.length - 1)] || 0;
        return <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: d.current ? '#1a7a4a' : '#9ab8a4' }}>{val}</div>
          <div style={{ position: 'absolute', bottom: `${(whoVal / max) * 100}%`, left: '10%', right: '10%', height: 2, background: '#f7c948', borderRadius: 1 }} />
          <div style={{ width: '100%', height: `${(val / max) * 100}%`, minHeight: 4, borderRadius: '4px 4px 0 0', background: d.current ? `linear-gradient(180deg,${color},${color}cc)` : `${color}55`, border: d.current ? `2px solid ${color}` : 'none' }} />
          <div style={{ fontSize: 9, color: d.current ? '#1a7a4a' : '#9ab8a4', fontWeight: d.current ? 700 : 500 }}>{(d.label || '').slice(0, 3)}</div>
        </div>;
      })}
    </div>
  </div>;
}

function ZGauge({ value, label }) {
  const pct = ((value + 3) / 6) * 100;
  const color = value >= -2 && value <= 2 ? '#22c55e' : value < -2 ? '#ef4444' : '#f59e0b';
  return <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}><span style={{ fontWeight: 600, color: '#374a3e' }}>{label}</span><span style={{ fontWeight: 800, color, fontFamily: "'Playfair Display',serif", fontSize: 15 }}>{value}</span></div>
    <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', position: 'relative', background: 'linear-gradient(90deg,#fca5a5 0%,#fcd34d 30%,#86efac 50%,#fcd34d 70%,#fca5a5 100%)' }}><div style={{ position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 2, background: '#0d1f14', left: `calc(${pct}% - 1.5px)` }} /></div>
  </div>;
}

export default function GrowthMonitoring() {
  const [children, setChildren] = useState([]), [selected, setSelected] = useState(null), [records, setRecords] = useState([]), [prediction, setPrediction] = useState(null), [loading, setLoading] = useState(true), [tab, setTab] = useState('weight');
  useEffect(() => { childAPI.list().then((r) => { setChildren(r.data); if (r.data[0]) setSelected(r.data[0]); }).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (!selected) return; setLoading(true); Promise.all([growthAPI.getHistory(selected._id), growthAPI.getPrediction(selected._id).catch(() => ({ data: null }))]).then(([h, p]) => { setRecords(h.data); setPrediction(p.data); }).catch(console.error).finally(() => setLoading(false)); }, [selected]);

  const data = useMemo(() => records.map((r, i) => ({ ...r, label: `${r.ageMonths}m`, current: i === records.length - 1 })), [records]);
  const latest = data[data.length - 1], prev = data[data.length - 2];
  const wGain = latest && prev ? (latest.weight - prev.weight).toFixed(1) : '0.0';
  const hGain = latest && prev ? (latest.height - prev.height).toFixed(1) : '0.0';
  const statusText = prediction?.prediction || selected?.nutritionStatus || 'healthy';

  return <div style={{ fontFamily: "'Nunito',sans-serif", background: '#f0f7f3', minHeight: '100vh', overflowX: 'hidden' }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito:wght@300;400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0} @keyframes fade{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
      .wrap{max-width:1200px;margin:0 auto;padding:20px 32px 60px}.main{display:grid;grid-template-columns:1fr 320px;gap:24px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}.interp{display:grid;grid-template-columns:1fr 1fr;gap:12px}.tips{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
      @media(max-width:1100px){.main,.interp,.tips{grid-template-columns:1fr!important}.cards{grid-template-columns:1fr 1fr!important}} @media(max-width:860px){.navlinks{display:none!important}.hero{flex-direction:column!important;align-items:flex-start!important}.cards{grid-template-columns:1fr!important}} @media(max-width:640px){.wrap{padding:20px 16px 60px}}
    `}</style>
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0d4a2e', display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', height: 64, boxShadow: '0 2px 20px rgba(0,0,0,.3)' }}>
      <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}><div style={{ width: 38, height: 38, background: 'rgba(255,255,255,.13)', border: '1.5px solid rgba(255,255,255,.24)', borderRadius: 10, display: 'grid', placeItems: 'center' }}>🌿</div><div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>Sishu Arogaya</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.48)' }}>Child Health Portal</div></div></Link>
      <div className="navlinks" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>{NAV.map(([l, to]) => <Link key={to} to={to} style={{ padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', background: to === '/parent/growth' ? 'rgba(247,201,72,.2)' : 'transparent', color: to === '/parent/growth' ? '#f7c948' : 'rgba(255,255,255,.65)' }}>{l}</Link>)}</div>
    </nav>

    <div style={{ background: 'linear-gradient(135deg,#0a3520 0%,#145c38 50%,#1e8050 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '36px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 26 }}><Link to="/parent/dashboard" style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>🏠 Dashboard</Link><span>›</span><Link to="/parent/child-profile" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>👶 My Child</Link><span>›</span><span style={{ color: '#f7c948', fontWeight: 600 }}>📈 Growth Monitoring</span></div>
        <div className="hero" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', paddingBottom: 36 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(247,201,72,.15)', border: '1px solid rgba(247,201,72,.35)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#f7c948', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>{selected?.name || 'Child'} growth tracker</div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(26px,3vw,42px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 10 }}>Growth <br /><span style={{ color: '#f7c948' }}>Monitoring</span></h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', maxWidth: 420, lineHeight: 1.7, marginBottom: 20 }}>Tracking weight, height, and nutrition status against WHO growth standards.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 12, padding: '10px 18px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} /><span style={{ fontSize: 14, fontWeight: 700, color: '#86efac' }}>{statusText} growth status</span></div>
          </div>
          <div className="cards" style={{ flexShrink: 0 }}>
            {[
              ['⚖️', 'Current Weight', latest?.weight ?? '-', 'kg', `+${wGain} kg`, '#f7c948', `WHO: ${WHO_W[Math.min(latest?.ageMonths || 0, WHO_W.length - 1)]}kg`],
              ['📏', 'Current Height', latest?.height ?? '-', 'cm', `+${hGain} cm`, '#7dd3fc', `WHO: ${WHO_H[Math.min(latest?.ageMonths || 0, WHO_H.length - 1)]}cm`],
              ['📊', 'WAZ Score', prediction?.waz ?? latest?.wazScore ?? '-', '', prediction?.wazStatus || 'Normal', '#86efac', 'WHO target: -1 to +1'],
              ['👶', 'Selected Child', selected?.name || '-', '', `${selected?.ageInMonths || 0} months`, '#c4b5fd', 'Live profile'],
            ].map(([icon, lbl, val, unit, gain, color, note]) => <div key={lbl} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 14, padding: '16px 18px', backdropFilter: 'blur(8px)' }}><div style={{ fontSize: 14, marginBottom: 6 }}>{icon}</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{val}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 3, color: 'rgba(255,255,255,.6)' }}>{unit}</span></div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', margin: '4px 0 2px' }}>{lbl}</div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, fontWeight: 700, color: '#86efac' }}>{gain}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,.38)' }}>{note}</span></div></div>)}
          </div>
        </div>
      </div>
      <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', marginTop: -1 }}><path d="M0,28 C360,56 1080,0 1440,28 L1440,48 L0,48 Z" fill="#f0f7f3" /></svg>
    </div>

    <div className="wrap">
      <div className="main">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #ddeae0', boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden', animation: 'fade .4s both' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e8f0ea', background: '#f8fdf9' }}>{[['weight', '⚖️ Weight', '#2eb872'], ['height', '📏 Height', '#3b82f6'], ['zscore', '📊 Z-Scores', '#8b5cf6'], ['table', '📋 Records', '#f59e0b']].map(([id, lbl, color]) => <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '14px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: tab === id ? color : '#7a9e88', borderBottom: tab === id ? `3px solid ${color}` : '3px solid transparent' }}>{lbl}</button>)}</div>
            <div style={{ padding: 24 }}>
              {loading ? <div className="text-center py-4"><div className="spinner-border text-success" /></div> : tab === 'weight' ? <>
                <BarChart data={data} who={WHO_W} keyName="weight" color="#2eb872" max={12} unit="kg" title="Weight (kg) vs WHO median" />
                <div style={{ marginTop: 20, padding: '14px 16px', background: '#f0faf5', borderRadius: 10, border: '1px solid #c8e4d4', fontSize: 13, color: '#1a5c35', lineHeight: 1.65 }}><strong>Weight insight:</strong> Current records show {latest?.weight ?? '-'} kg. Continue balanced meals and regular monthly growth checks.</div>
              </> : tab === 'height' ? <>
                <BarChart data={data} who={WHO_H} keyName="height" color="#3b82f6" max={90} unit="cm" title="Height (cm) vs WHO median" />
                <div style={{ marginTop: 20, padding: '14px 16px', background: '#eff6ff', borderRadius: 10, border: '1px solid #93c5fd', fontSize: 13, color: '#1e3a5f', lineHeight: 1.65 }}><strong>Height insight:</strong> Current records show {latest?.height ?? '-'} cm. Sleep, nutrition, and follow-up checks remain important.</div>
              </> : tab === 'zscore' ? <>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0d1f14', marginBottom: 16 }}>WHO Z-Score Gauges</div>
                  <ZGauge value={prediction?.waz ?? latest?.wazScore ?? 0} label="Weight for Age (WAZ)" />
                  <ZGauge value={prediction?.haz ?? latest?.hazScore ?? 0} label="Height for Age (HAZ)" />
                  <ZGauge value={prediction?.whz ?? latest?.whzScore ?? 0} label="Weight for Height (WHZ)" />
                </div>
              </> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#f0f7f3' }}>{['Date', 'Age (mo)', 'Weight', 'Height', 'WAZ', 'HAZ', 'Status'].map((h) => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7a9e88', textTransform: 'uppercase', borderBottom: '2px solid #ddeae0' }}>{h}</th>)}</tr></thead><tbody>{data.length ? data.map((r) => <tr key={r._id} style={{ borderBottom: '1px solid #e8f0ea', background: r.current ? '#f0faf5' : '#fff' }}><td style={{ padding: '11px 12px' }}>{fmt(r.recordedDate)}</td><td style={{ padding: '11px 12px' }}>{r.ageMonths}</td><td style={{ padding: '11px 12px' }}>{r.weight}</td><td style={{ padding: '11px 12px' }}>{r.height}</td><td style={{ padding: '11px 12px' }}>{r.wazScore}</td><td style={{ padding: '11px 12px' }}>{r.hazScore}</td><td style={{ padding: '11px 12px' }}>{r.prediction || 'recorded'}</td></tr>) : <tr><td colSpan="7" style={{ padding: 20, textAlign: 'center', color: '#7a9e88' }}>No growth records available.</td></tr>}</tbody></table></div>}
            </div>
          </div>

          <div style={{ animation: 'fade .5s .1s both' }}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: '#0d1f14', marginBottom: 14 }}>What Your Child&apos;s Numbers Mean</div>
            <div className="interp">{[
              ['Weight for Age (WAZ)', prediction?.waz ?? latest?.wazScore ?? '-', prediction?.wazStatus || 'Normal'],
              ['Height for Age (HAZ)', prediction?.haz ?? latest?.hazScore ?? '-', prediction?.hazStatus || 'Normal'],
              ['Weight for Height (WHZ)', prediction?.whz ?? latest?.whzScore ?? '-', prediction?.whzStatus || 'Normal'],
              ['AI Prediction', prediction?.prediction || selected?.nutritionStatus || 'healthy', prediction?.advice || 'Continue current nutrition and monitoring.'],
            ].map(([label, value, detail]) => <div key={label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #ddeae0', padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}><div style={{ fontSize: 13, fontWeight: 700, color: '#0d1f14', marginBottom: 10 }}>{label}</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>{value}</div><div style={{ fontSize: 12, color: '#5a7a64', lineHeight: 1.65 }}>{detail}</div></div>)}</div>
          </div>

          <div style={{ animation: 'fade .5s .15s both' }}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: '#0d1f14', marginBottom: 14 }}>Tips to Support Growth</div>
            <div className="tips">{TIPS.map(([icon, title, desc]) => <div key={title} style={{ background: '#fff', borderRadius: 14, border: '1px solid #ddeae0', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}><div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div><div style={{ fontSize: 13, fontWeight: 800, color: '#0d1f14', marginBottom: 5 }}>{title}</div><div style={{ fontSize: 12, color: '#5a7a64', lineHeight: 1.6 }}>{desc}</div></div>)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fade .4s .08s both' }}>
          <div style={{ background: 'linear-gradient(135deg,#1a7a4a,#0d4a2e)', borderRadius: 16, padding: '20px', boxShadow: '0 6px 20px rgba(13,74,46,.25)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Selected Child</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>{selected?.name || 'No child selected'}</div>
            {children.length > 1 ? <select className="form-select" value={selected?._id} onChange={(e) => setSelected(children.find((c) => c._id === e.target.value))}>{children.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select> : null}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ddeae0', boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
            <div style={{ background: '#f0f7f3', padding: '12px 18px', borderBottom: '1px solid #ddeae0', fontSize: 13, fontWeight: 700, color: '#1a7a4a' }}>Next Growth Check</div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#0d1f14', marginBottom: 4 }}>Next monthly review</div>
              <div style={{ fontSize: 13, color: '#5a7a64', marginBottom: 12 }}>Visit the nearest health centre or ASHA worker for the next measurement update.</div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ddeae0', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0d1f14', marginBottom: 14 }}>WHO Reference</div>
            {[['Median Weight', `${WHO_W[Math.min(latest?.ageMonths || 0, WHO_W.length - 1)]} kg`], ['Median Height', `${WHO_H[Math.min(latest?.ageMonths || 0, WHO_H.length - 1)]} cm`], ['Current Weight', `${latest?.weight || '-'} kg`], ['Current Height', `${latest?.height || '-'} cm`]].map(([lbl, val]) => <div key={lbl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f0f4f0' }}><div style={{ fontSize: 12, fontWeight: 600, color: '#374a3e' }}>{lbl}</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: '#1a7a4a' }}>{val}</div></div>)}
          </div>
        </div>
      </div>
    </div>

    <div style={{ background: '#0d4a2e', color: 'rgba(255,255,255,.45)', textAlign: 'center', padding: '16px 20px', fontSize: 12 }}>Sishu Arogaya © 2026 · Government Integrated Child Health Monitoring System · Dev Bhoomi Uttrakhand University</div>
  </div>;
}

function fmt(d) { const x = new Date(d); return Number.isNaN(x.getTime()) ? 'N/A' : x.toLocaleDateString('en-IN'); }
