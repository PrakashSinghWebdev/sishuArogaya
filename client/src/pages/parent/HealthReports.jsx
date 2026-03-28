import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportAPI } from '../../services/api';
import useSelectedChild from '../../hooks/useSelectedChild';

const SLIDES = [
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1476703993599-0eb30cd8c063?w=1400&q=80&fit=crop',
];

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

const REPORT_TYPES = [
  {
    id: 'comprehensive',
    icon: '📄',
    accent: '#0891b2',
    badge: '📊',
    badgeBg: '#f0fdff',
    badgeColor: '#0e7490',
    title: 'Comprehensive Health Report',
    subtitle: 'Complete Health Summary',
    meta: 'Aug 2024 · 12 pages',
    actions: ['📥 PDF', '📊 Excel'],
  },
  {
    id: 'vaccination',
    icon: '🏅',
    accent: '#1d4ed8',
    badge: '💉',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    title: 'Vaccination Certificate',
    subtitle: 'Vaccine Certificate',
    meta: 'Official NHM format',
    actions: ['📥 PDF', '🖨️ Print'],
  },
  {
    id: 'growth',
    icon: '📉',
    accent: '#059669',
    badge: '📈',
    badgeBg: '#f0fdf4',
    badgeColor: '#059669',
    title: 'Growth Chart',
    subtitle: 'WHO Growth Chart',
    meta: 'Birth to 18 months',
    actions: ['📥 PDF', '📊 Excel'],
  },
];

const HISTORY_ROWS = [
  { name: 'Comprehensive Health Report', date: 'Aug 15, 2024', type: 'PDF', by: 'Dr. Meena Sharma', typePill: 'teal' },
  { name: 'Vaccination Certificate', date: 'Jul 22, 2024', type: 'PDF', by: 'ASHA Worker', typePill: 'blue' },
  { name: 'Growth Chart (6 months)', date: 'Jul 10, 2024', type: 'PDF', by: 'Dr. R. Gupta', typePill: 'green' },
  { name: 'Nutritional Assessment', date: 'Jun 05, 2024', type: 'PDF', by: 'ASHA Worker', typePill: 'amber' },
  { name: 'Monthly Health Summary', date: 'May 28, 2024', type: 'PDF', by: 'Dr. Meena Sharma', typePill: 'teal' },
];

export default function HealthReports() {
  const [slide, setSlide] = useState(0);
  const slideRef = useRef(0);
  const { children, selectedChild, selectedChildId, setSelectedChild, loading } = useSelectedChild();
  const [downloading, setDownloading] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  // Carousel
  useEffect(() => {
    const id = setInterval(() => {
      slideRef.current = (slideRef.current + 1) % SLIDES.length;
      setSlide(slideRef.current);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const handlePrint = () => window.print();

  const downloadPDF = async (childId, name) => {
    setDownloading(childId);
    try {
      const res = await reportAPI.childPDF(childId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}-health-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  const pillColor = (type) => {
    const map = {
      teal: { bg: '#f0fdff', color: '#0e7490' },
      blue: { bg: '#dbeafe', color: '#1d4ed8' },
      green: { bg: '#d1fae5', color: '#059669' },
      amber: { bg: '#fef3c7', color: '#b45309' },
    };
    return map[type] || map.teal;
  };

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
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 9px; font-size: .84rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: filter .15s, transform .1s; }
        .btn:hover { filter: brightness(1.07); transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .btn-teal { background: var(--teal); color: #fff; }
        .btn-outline { background: #fff; color: var(--teal2); border: 1.5px solid var(--border); }
        .btn-sm { padding: 6px 12px; font-size: .78rem; }
        .btn-disabled { opacity: .6; cursor: not-allowed; }
        .selector-bar { display: flex; align-items: center; gap: 12px; background: #fff; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .selector-bar label { font-size: .84rem; font-weight: 600; color: var(--muted); }
        .selector-bar select { border: 1.5px solid var(--border); border-radius: 7px; padding: 6px 12px; font-size: .86rem; color: var(--text); background: var(--teal4); cursor: pointer; }
        .report-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 28px; }
        .report-type-card { background: #fff; border: 1.5px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(8,145,178,.07); transition: transform .15s, box-shadow .15s; }
        .report-type-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(8,145,178,.12); }
        .rtc-header { padding: 18px 18px 14px; border-bottom: 1px solid var(--border); }
        .rtc-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 10px; }
        .rtc-subtitle { font-size: .82rem; font-weight: 700; color: var(--text); margin-bottom: 3px; }
        .rtc-meta { font-size: .75rem; color: var(--muted); }
        .rtc-title { font-family: 'Libre Baskerville', serif; font-size: .94rem; font-weight: 700; color: var(--text); padding: 12px 18px 0; }
        .rtc-actions { display: flex; gap: 8px; padding: 12px 18px 16px; flex-wrap: wrap; }
        .history-card { background: #fff; border: 1.5px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(8,145,178,.07); margin-bottom: 24px; }
        .history-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); }
        .history-header h3 { font-family: 'Libre Baskerville', serif; font-size: 1rem; font-weight: 700; color: var(--text); }
        table.report-table { width: 100%; border-collapse: collapse; }
        .report-table th { padding: 10px 16px; font-size: .78rem; font-weight: 700; color: var(--muted); text-align: left; border-bottom: 1.5px solid var(--border); background: var(--teal4); }
        .report-table td { padding: 11px 16px; font-size: .84rem; color: var(--text); vertical-align: middle; }
        .report-table tr:nth-child(odd) td { background: var(--teal4); }
        .report-table tr:nth-child(even) td { background: #fff; }
        .type-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: .7rem; font-weight: 700; }
        .empty-card { background: var(--teal4); border: 1.5px solid var(--border); border-radius: 14px; padding: 48px 24px; text-align: center; }
        .empty-icon { font-size: 3rem; margin-bottom: 12px; }
        .empty-title { font-family: 'Libre Baskerville', serif; font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .empty-desc { font-size: .88rem; color: var(--muted); }
        footer.footbar { background: var(--teal2); color: rgba(255,255,255,.9); text-align: center; padding: 18px 24px; font-size: .8rem; }
        .spin-btn { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.5); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @media (max-width: 900px) {
          .report-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          nav.topnav .navlinks { display: none; }
          .report-grid { grid-template-columns: 1fr; }
          .report-table th:nth-child(4), .report-table td:nth-child(4) { display: none; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="topnav">
        <Link className="nav-brand" to="/parent/dashboard">🌿 Sishu Arogaya</Link>
        <div className="navlinks">
          {NAV.map(([label, href]) => (
            <Link key={href} to={href} className={href === '/parent/reports' ? 'active' : ''}>{label}</Link>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        {SLIDES.map((src, i) => (
          <div
            key={i}
            className="hero-slide"
            style={{ backgroundImage: `url(${src})`, opacity: slide === i ? 1 : 0 }}
          />
        ))}
        <div className="hero-overlay" />
        <div className="hero-content fade-up">
          <span className="hero-badge">🏥 Health Reports</span>
          <h1 className="hero-title">Download Child <span>Health Reports</span></h1>
        </div>
      </section>

      <main>
        {/* Page Header */}
        <div className="page-header">
          <h2>📋 Health Reports</h2>
          <button
            className={`btn btn-teal${downloading || !selectedChild ? ' btn-disabled' : ''}`}
            onClick={() => selectedChild && !downloading && downloadPDF(selectedChild._id, selectedChild.name)}
            disabled={!!downloading || !selectedChild}
          >
            {downloading ? <><span className="spin-btn" /> Downloading…</> : '📥 Download All Reports'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="spinner" />
            <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: '.9rem' }}>Loading reports…</p>
          </div>
        ) : children.length === 0 ? (
          <div className="empty-card fade-up">
            <div className="empty-icon">📁</div>
            <div className="empty-title">No children registered</div>
            <div className="empty-desc">Please add a child profile first to access health reports.</div>
          </div>
        ) : (
          <>
            {/* Child selector */}
            {children.length > 1 && (
              <div className="selector-bar">
                <label>Select Child:</label>
                <select value={selectedChildId} onChange={e => setSelectedChild(e.target.value)}>
                  {children.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                {selectedChild && (
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                    {selectedChild.ageInMonths || 0} months · {selectedChild.gender}
                  </span>
                )}
              </div>
            )}

            {/* Report type cards */}
            <div className="report-grid">
              {REPORT_TYPES.map(rt => (
                <div key={rt.id} className="report-type-card fade-up" style={{ borderTop: `3px solid ${rt.accent}` }}>
                  <div className="rtc-header">
                    <div className="rtc-icon-wrap" style={{ background: rt.badgeBg }}>
                      <span style={{ fontSize: '1.5rem' }}>{rt.icon}</span>
                    </div>
                    <div className="rtc-subtitle">{rt.subtitle}</div>
                    <div className="rtc-meta">{rt.meta}</div>
                  </div>
                  <div className="rtc-title">{rt.title}</div>
                  <div className="rtc-actions">
                    {rt.actions.map((action, ai) => (
                      <button
                        key={ai}
                        className={`btn btn-sm ${ai === 0 ? 'btn-teal' : 'btn-outline'}`}
                        style={ai === 0 ? { background: rt.accent } : {}}
                        onClick={() => {
                          if (ai === 0 && selectedChild) {
                            downloadPDF(selectedChild._id, selectedChild.name);
                          } else if (action.includes('Print') || action.includes('🖨️')) {
                            handlePrint();
                          } else if (selectedChild) {
                            downloadPDF(selectedChild._id, selectedChild.name);
                          }
                        }}
                        disabled={ai === 0 && !!downloading}
                      >
                        {ai === 0 && downloading ? <span className="spin-btn" /> : null}
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Report History Table */}
            <div className="history-card fade-up">
              <div className="history-header">
                <h3>📂 All Generated Reports</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {showFilter && (
                    <select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      style={{ border: '1.5px solid var(--border)', borderRadius: 7, padding: '5px 10px', fontSize: '.82rem', color: 'var(--text)', background: 'var(--teal4)' }}
                    >
                      <option value="all">All Types</option>
                      <option value="teal">Comprehensive</option>
                      <option value="blue">Vaccination</option>
                      <option value="green">Growth</option>
                      <option value="amber">Nutrition</option>
                    </select>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={() => setShowFilter(v => !v)}>
                    🔽 Filter
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Report Name</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Generated By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HISTORY_ROWS.filter(r => filterType === 'all' || r.typePill === filterType).map((row, i) => {
                      const pc = pillColor(row.typePill);
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{row.name}</td>
                          <td style={{ color: 'var(--muted)' }}>{row.date}</td>
                          <td>
                            <span className="type-pill" style={{ background: pc.bg, color: pc.color }}>{row.type}</span>
                          </td>
                          <td style={{ color: 'var(--muted)' }}>{row.by}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn btn-teal btn-sm"
                                onClick={() => selectedChild && downloadPDF(selectedChild._id, selectedChild.name)}
                                disabled={!!downloading}
                              >
                                {downloading ? <span className="spin-btn" /> : '📥 PDF'}
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={handlePrint}>
                                🖨️ Print
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="footbar">
        Sishu Arogaya © 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
      </footer>
    </>
  );
}
