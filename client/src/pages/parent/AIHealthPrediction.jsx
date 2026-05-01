import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import MediaCarousel, { MEDIA_ARRAY } from '../../components/MediaCarousel';
import { childAPI, growthAPI, reportAPI } from '../../services/api';



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

const Z_GRADIENT = 'linear-gradient(90deg,#fca5a5,#ef4444 20%,#fcd34d 35%,#86efac 50%,#6ee7b7 65%,#fcd34d 80%,#fca5a5)';

function dotPosition(score) {
  const clamped = Math.max(-3, Math.min(3, score || 0));
  return ((clamped + 3) / 6) * 100;
}

function statusColor(status) {
  if (!status) return '#6b7280';
  const s = status.toLowerCase();
  if (s === 'healthy' || s === 'normal') return '#059669';
  if (s === 'moderate') return '#f59e0b';
  return '#ef4444';
}

function predictionMeta(p) {
  if (!p) return { emoji: '✅', label: 'Healthy — Normal Growth', desc: 'Your child is growing well within normal WHO standards.', score: 80, scoreLabel: 'Excellent ✓', color: '#1d4ed8' };
  switch ((p || '').toLowerCase()) {
    case 'healthy':
      return { emoji: '✅', label: 'Healthy — Normal Growth', desc: 'Your child is growing well within normal WHO standards. Keep up the good nutrition and regular check-ups.', score: 80, scoreLabel: 'Excellent ✓', color: '#1d4ed8' };
    case 'moderate':
      return { emoji: '⚠️', label: 'Moderate — Monitor Closely', desc: 'Your child shows signs of moderate nutritional risk. Consult your ASHA worker and follow the dietary recommendations.', score: 62, scoreLabel: 'Monitor', color: '#1d4ed8' };
    case 'severe':
      return { emoji: '🚨', label: 'Severe — Immediate Attention', desc: 'Your child is at risk of severe malnutrition. Please visit the nearest PHC or contact your ASHA worker immediately.', score: 42, scoreLabel: 'Urgent', color: '#1d4ed8' };
    default:
      return { emoji: '✅', label: 'Healthy — Normal Growth', desc: 'Your child is growing well within normal WHO standards.', score: 80, scoreLabel: 'Excellent ✓', color: '#1d4ed8' };
  }
}

export default function AIHealthPrediction() {
  const { navLinks, t } = useLanguage();
  const [slide, setSlide] = useState(0);
  const slideRef = useRef(0);
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [childLoading, setChildLoading] = useState(true);

  // Carousel
  useEffect(() => {
    const id = setInterval(() => {
      slideRef.current = (slideRef.current + 1) % MEDIA_ARRAY.length;
      setSlide(slideRef.current);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  // Load children
  useEffect(() => {
    setChildLoading(true);
    childAPI.list()
      .then(r => {
        const list = r.data || [];
        setChildren(list);
        if (list[0]) setSelected(list[0]);
      })
      .catch(console.error)
      .finally(() => setChildLoading(false));
  }, []);

  // Load prediction when selected child changes
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    growthAPI.getPrediction(selected._id)
      .then(r => setPrediction(r.data))
      .catch(() => setPrediction(null))
      .finally(() => setLoading(false));
  }, [selected]);

  const [dlLoading, setDlLoading] = useState(false);

  const handleDownload = async () => {
    if (!selected) return;
    setDlLoading(true);
    try {
      const res = await reportAPI.childPDF(selected._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selected.name}-health-report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { alert('Failed to download report.'); }
    finally { setDlLoading(false); }
  };

  const handleShare = async () => {
    const text = `Shishu Aarogya Health Report — ${selected?.name || 'Child'}: ${prediction?.prediction || 'healthy'} nutritional status.`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Child Health Report', text }); return; } catch {}
    }
    navigator.clipboard.writeText(text).then(
      () => alert('Report summary copied to clipboard!'),
      () => alert(text)
    );
  };

  const meta = prediction ? predictionMeta(prediction.prediction) : null;

  const circumference = 2 * Math.PI * 45;

  const zCards = prediction ? [
    { key: 'WAZ', label: 'Weight-for-Age Z-Score', val: prediction.waz, status: prediction.wazStatus, desc: 'Reflects body weight relative to age. Indicates underweight if below -2.', borderColor: '#059669' },
    { key: 'HAZ', label: 'Height-for-Age Z-Score', val: prediction.haz, status: prediction.hazStatus, desc: 'Reflects linear growth. A value below -2 indicates stunting.', borderColor: '#1d4ed8' },
    { key: 'WHZ', label: 'Weight-for-Height Z-Score', val: prediction.whz, status: prediction.whzStatus, desc: 'Reflects acute malnutrition. A value below -2 indicates wasting.', borderColor: '#f59e0b' },
  ] : [];

  const adviceTips = prediction?.advice
    ? prediction.advice.split(/\.\s+/).filter(Boolean).map(t => t.trim().replace(/\.$/, ''))
    : [
        'Maintain a balanced diet rich in proteins and micronutrients',
        'Ensure regular breastfeeding for infants under 6 months',
        'Schedule follow-up visits with your ASHA worker',
        'Monitor weight and height monthly',
        'Complete all vaccination schedules on time',
      ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f8fffe; color: #0c2340; }
        :root {
          --teal: #0891b2; --teal2: #0e7490; --teal3: #cffafe; --teal4: #f0fdff;
          --bg: #f8fffe; --text: #0c2340; --muted: #4a7a8a; --border: #c5e8ef;
          --red: #ef4444; --green: #059669; --amber: #f59e0b; --blue: #1d4ed8;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .spinner { width: 40px; height: 40px; border: 3px solid var(--teal3); border-top-color: var(--teal); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        nav.topnav { position: sticky; top: 0; z-index: 100; background: #fff; height: 64px; display: flex; align-items: center; box-shadow: 0 2px 8px rgba(8,145,178,.08); border-bottom: 2px solid #cffafe; padding: 0 28px; gap: 0; }
        .nav-brand { font-family: 'Libre Baskerville', serif; font-size: 1.18rem; font-weight: 700; color: var(--teal2); margin-right: 32px; white-space: nowrap; text-decoration: none; }
        .navlinks { display: flex; gap: 2px; flex-wrap: nowrap; overflow-x: auto; }
        .navlinks a { font-size: .82rem; font-weight: 500; color: var(--muted); padding: 6px 11px; border-radius: 7px; text-decoration: none; white-space: nowrap; transition: background .15s, color .15s; }
        .navlinks a:hover { background: var(--teal4); color: var(--teal2); }
        .navlinks a.active { background: var(--teal3); color: var(--teal2); font-weight: 600; }
        .hero { position: relative; height: 240px; overflow: hidden; }
        .hero-slide { position: absolute; inset: 0; background-size: cover; background-position: center; transition: opacity 0.8s ease; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(8,145,178,.82) 0%, rgba(14,116,144,.72) 100%); }
        .hero-content { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 20px; }
        .hero-badge { display: inline-block; background: rgba(255,255,255,.18); color: #fff; font-size: .78rem; font-weight: 600; padding: 4px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,.35); margin-bottom: 10px; letter-spacing: .04em; }
        .hero-title { font-family: 'Libre Baskerville', serif; font-size: clamp(1.4rem, 3.5vw, 2.1rem); font-weight: 700; color: #fff; }
        .hero-title span { color: #cffafe; }
        main { max-width: 1280px; margin: 0 auto; padding: 28px 20px 48px; }
        .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .page-header h2 { font-family: 'Libre Baskerville', serif; font-size: 1.35rem; font-weight: 700; color: var(--text); }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 9px; font-size: .86rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: filter .15s, transform .1s; }
        .btn:hover { filter: brightness(1.07); transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .btn-teal { background: var(--teal); color: #fff; }
        .btn-outline { background: #fff; color: var(--teal2); border: 1.5px solid var(--border); }
        .btn-blue { background: #1d4ed8; color: #fff; }
        .card { background: #fff; border: 1.5px solid var(--border); border-radius: 14px; box-shadow: 0 2px 10px rgba(8,145,178,.07); }
        .card-body { padding: 22px; }
        .result-card { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1.5px solid #bfdbfe; border-radius: 14px; padding: 28px; display: flex; align-items: center; gap: 28px; flex-wrap: wrap; margin-bottom: 24px; }
        .result-left { flex: 1 1 300px; }
        .result-label { font-size: .78rem; font-weight: 600; color: #1d4ed8; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 8px; }
        .result-emoji { font-size: 3rem; margin-bottom: 6px; line-height: 1; }
        .result-title { font-family: 'Libre Baskerville', serif; font-size: 1.6rem; font-weight: 700; color: #1e3a8a; margin-bottom: 8px; }
        .result-desc { font-size: .9rem; color: #3730a3; line-height: 1.6; }
        .score-circle { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .score-circle svg { overflow: visible; }
        .score-val { font-family: 'Libre Baskerville', serif; font-size: 1.6rem; font-weight: 700; color: #1e3a8a; }
        .score-lbl { font-size: .78rem; font-weight: 600; color: #1d4ed8; }
        .z-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .z-card { background: #fff; border: 1.5px solid var(--border); border-radius: 14px; padding: 18px; }
        .z-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .z-key { font-family: 'Libre Baskerville', serif; font-size: 1.1rem; font-weight: 700; color: var(--text); }
        .z-label { font-size: .78rem; color: var(--muted); margin-bottom: 10px; }
        .z-val { font-size: 1.7rem; font-weight: 700; color: var(--text); margin-bottom: 10px; }
        .pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600; }
        .pill-green { background: #d1fae5; color: #059669; }
        .pill-amber { background: #fef3c7; color: #b45309; }
        .pill-red { background: #fee2e2; color: #dc2626; }
        .pill-blue { background: #dbeafe; color: #1d4ed8; }
        .grad-bar { position: relative; height: 8px; border-radius: 20px; margin-bottom: 6px; }
        .grad-dot { position: absolute; top: 50%; width: 14px; height: 14px; border-radius: 50%; background: #1e3a8a; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.2); transform: translate(-50%, -50%); transition: left .5s; }
        .z-desc { font-size: .78rem; color: var(--muted); line-height: 1.5; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .guide-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 10px; margin-bottom: 10px; }
        .guide-icon { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        .guide-status { font-size: .82rem; font-weight: 700; margin-bottom: 2px; }
        .guide-desc { font-size: .78rem; color: var(--muted); }
        .tip-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: var(--teal4); border-left: 3px solid var(--teal); border-radius: 0 8px 8px 0; margin-bottom: 8px; font-size: .84rem; color: var(--text); line-height: 1.5; }
        .selector-bar { display: flex; align-items: center; gap: 12px; background: #fff; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; flex-wrap: wrap; }
        .selector-bar label { font-size: .84rem; font-weight: 600; color: var(--muted); }
        .selector-bar select { border: 1.5px solid var(--border); border-radius: 7px; padding: 6px 12px; font-size: .86rem; color: var(--text); background: var(--teal4); cursor: pointer; }
        .empty-card { background: var(--teal4); border: 1.5px solid var(--border); border-radius: 14px; padding: 48px 24px; text-align: center; }
        .empty-icon { font-size: 3rem; margin-bottom: 12px; }
        .empty-title { font-family: 'Libre Baskerville', serif; font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .empty-desc { font-size: .88rem; color: var(--muted); }
        footer.footbar { background: var(--teal2); color: rgba(255,255,255,.9); text-align: center; padding: 18px 24px; font-size: .8rem; }
        @media (max-width: 768px) {
          nav.topnav .navlinks { display: none; }
          .z-grid { grid-template-columns: 1fr; }
          .two-col { grid-template-columns: 1fr; }
          .result-card { flex-direction: column; }
        }
        @media (max-width: 900px) {
          .z-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="topnav">
        <Link className="nav-brand" to="/parent/dashboard">
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 16 }}>🏥</div>
          <div style={{ marginLeft: 8 }}>
            <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 15, fontWeight: 700, color: '#0e7490', lineHeight: 1.1 }}>Shishu Aarogya</div>
            <div style={{ fontSize: 8, color: '#4a7a8a', lineHeight: 1 }}>National Child Health Portal</div>
          </div>
        </Link>
        <div className="navlinks">
          {(navLinks && navLinks.length ? navLinks : NAV).map(([label, to]) => (
            <Link key={to} to={to} className={to === '/parent/ai-prediction' ? 'active' : ''}>{label}</Link>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <MediaCarousel currentSlideIndex={slide} />
        <div className="hero-overlay" />
        <div className="hero-content fade-up">
          <span className="hero-badge">🏥 AI Health Prediction</span>
          <h1 className="hero-title">AI Malnutrition <span>Prediction</span></h1>
        </div>
      </section>

      <main>
        {/* Page Header */}
        <div className="page-header">
          <h2>🤖 AI Health Prediction</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={handleDownload} disabled={!selected || !prediction || dlLoading}>
              {dlLoading ? '⏳ Downloading…' : '📥 Download Report'}
            </button>
            <button className="btn btn-blue" onClick={handleShare} disabled={!prediction}>
              📤 Share
            </button>
          </div>
        </div>

        {/* Child selector */}
        {children.length > 1 && (
          <div className="selector-bar">
            <label>Select Child:</label>
            <select value={selected?._id || ''} onChange={e => setSelected(children.find(c => c._id === e.target.value))}>
              {children.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {childLoading || loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="spinner" />
            <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: '.9rem' }}>Analyzing growth data…</p>
          </div>
        ) : !prediction ? (
          <div className="empty-card fade-up">
            <div className="empty-icon">📊</div>
            <div className="empty-title">No growth data available yet</div>
            <div className="empty-desc">Growth records must be entered by your ASHA worker first. Please contact your assigned ASHA worker to log the latest measurements.</div>
          </div>
        ) : (
          <>
            {/* Result Card */}
            <div className="result-card fade-up">
              <div className="result-left">
                <div className="result-label">AI Prediction Result · Last Updated Today</div>
                <div className="result-emoji">{meta.emoji}</div>
                <h2 className="result-title">{meta.label}</h2>
                <p className="result-desc">{meta.desc}</p>
              </div>
              <div className="score-circle">
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="45" fill="none" stroke="#bfdbfe" strokeWidth="8" />
                  <circle
                    cx="55" cy="55" r="45"
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (meta.score / 100) * circumference}
                    transform="rotate(-90 55 55)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                  <text x="55" y="51" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="700" fill="#1e3a8a" fontFamily="Libre Baskerville,serif">{meta.score}</text>
                  <text x="55" y="68" textAnchor="middle" fontSize="9" fill="#1d4ed8" fontWeight="600">/100</text>
                </svg>
                <span className="score-lbl">{meta.scoreLabel}</span>
              </div>
            </div>

            {/* Z-Score Cards */}
            <div className="z-grid">
              {zCards.map(z => {
                const pct = dotPosition(z.val);
                const sc = statusColor(z.status);
                const pillClass = z.status?.toLowerCase() === 'healthy' || z.status?.toLowerCase() === 'normal' ? 'pill-green'
                  : z.status?.toLowerCase() === 'moderate' ? 'pill-amber'
                  : z.status?.toLowerCase() === 'severe' ? 'pill-red'
                  : 'pill-blue';
                return (
                  <div key={z.key} className="z-card fade-up" style={{ borderTop: `3px solid ${z.borderColor}` }}>
                    <div className="z-card-top">
                      <span className="z-key">{z.key}</span>
                      <span className={`pill ${pillClass}`}>{z.status || 'N/A'}</span>
                    </div>
                    <div className="z-label">{z.label}</div>
                    <div className="z-val" style={{ color: sc }}>{typeof z.val === 'number' ? z.val.toFixed(2) : '—'}</div>
                    <div className="grad-bar" style={{ background: Z_GRADIENT }}>
                      <div className="grad-dot" style={{ left: `${pct}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--muted)', marginBottom: 8 }}>
                      <span>-3</span><span>-2</span><span>-1</span><span>0</span><span>+1</span><span>+2</span><span>+3</span>
                    </div>
                    <div className="z-desc">{z.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Classification Guide + Advice */}
            <div className="two-col">
              {/* Guide */}
              <div className="card fade-up">
                <div className="card-body">
                  <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>📖 Z-Score Classification Guide</h3>
                  <div className="guide-row" style={{ background: '#d1fae5' }}>
                    <div className="guide-icon" style={{ background: '#a7f3d0', fontSize: '1rem' }}>✅</div>
                    <div>
                      <div className="guide-status" style={{ color: '#059669' }}>Healthy (z ≥ −1)</div>
                      <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#065f46', marginBottom: 2 }}>Normal</div>
                      <div className="guide-desc">Child's growth is within normal WHO standards. Continue current feeding and care practices.</div>
                    </div>
                  </div>
                  <div className="guide-row" style={{ background: '#fef3c7' }}>
                    <div className="guide-icon" style={{ background: '#fde68a', fontSize: '1rem' }}>⚠️</div>
                    <div>
                      <div className="guide-status" style={{ color: '#b45309' }}>Moderate (−2 to −1)</div>
                      <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#92400e', marginBottom: 2 }}>Monitor</div>
                      <div className="guide-desc">At-risk zone. Increase nutritious food intake, schedule ASHA follow-up, and monitor monthly.</div>
                    </div>
                  </div>
                  <div className="guide-row" style={{ background: '#fee2e2' }}>
                    <div className="guide-icon" style={{ background: '#fecaca', fontSize: '1rem' }}>🚨</div>
                    <div>
                      <div className="guide-status" style={{ color: '#dc2626' }}>Severe (z &lt; −2)</div>
                      <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#991b1b', marginBottom: 2 }}>Urgent</div>
                      <div className="guide-desc">Immediate referral to PHC or NRC required. This indicates severe acute or chronic malnutrition.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="card fade-up">
                <div className="card-body">
                  <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>👨‍⚕️ Doctor's Recommendations</h3>
                  {adviceTips.map((tip, i) => (
                    <div key={i} className="tip-row">
                      <span style={{ color: 'var(--teal)', fontSize: '1rem', flexShrink: 0 }}>•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn btn-teal" onClick={handleDownload} disabled={dlLoading}>
                      {dlLoading ? '⏳ …' : '📥 Download'}
                    </button>
                    <button className="btn btn-outline" onClick={handleShare}>📤 Share</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="footbar" style={{ textAlign: 'center', padding: '20px', color: '#4a7a8a', fontSize: '13px', borderTop: '1px solid #c5e8ef' }}>
        Shishu Aarogya &copy; 2024 &middot; {t('homeFooter_copyright_long') || 'National Child Health Portal · Government of India'}
      </footer>
    </>
  );
}
