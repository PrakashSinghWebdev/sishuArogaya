import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MediaCarousel, { MEDIA_ARRAY } from '../../components/MediaCarousel';
import { reportAPI } from '../../services/api';
import useSelectedChild from '../../hooks/useSelectedChild';
import { normalizeText, useLanguage } from '../../context/LanguageContext';

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
    title: 'Comprehensive Health Report',
    subtitle: 'Complete Health Summary',
    meta: 'Live PDF export',
    actions: ['📥 PDF', '📄 PDF Copy'],
  },
  {
    id: 'vaccination',
    icon: '💉',
    accent: '#1d4ed8',
    title: 'Vaccination Report',
    subtitle: 'Vaccine Summary',
    meta: 'Latest schedule status',
    actions: ['📥 PDF', '🖨️ Print'],
  },
  {
    id: 'growth',
    icon: '📉',
    accent: '#059669',
    title: 'Growth Report',
    subtitle: 'Health Growth Snapshot',
    meta: 'Latest recorded trend',
    actions: ['📥 PDF', '🖨️ Print'],
  },
];

export default function HealthReports() {
  const { user } = useAuth();
  const location = useLocation();
  const userInitial = (user?.name || 'P')[0].toUpperCase();
  const { t, navLinks } = useLanguage();
  const [slide, setSlide] = useState(0);
  const slideRef = useRef(0);
  const { children, selectedChild, selectedChildId, setSelectedChild, loading } = useSelectedChild();
  const [downloading, setDownloading] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);

  useEffect(() => {
    const id = setInterval(() => {
      slideRef.current = (slideRef.current + 1) % MEDIA_ARRAY.length;
      setSlide(slideRef.current);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const handleReportAction = async (childId, childName, reportType, reportTitle, action) => {
    const toast = action === 'preview' ? setDownloading : setDownloading; // Using downloading for both as a loading state
    setDownloading(`${childId}-${reportType}-${action}`);

    try {
      if (!childId) throw new Error('No child selected');
      
      const response = await reportAPI.childPDF(childId, reportType);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      if (action === 'preview') {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${childName}_${reportType}_Report.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      window.URL.revokeObjectURL(url);

      if (action === 'download') {
        setReportHistory((prev) => [
          {
            name: `${childName} — ${reportTitle}`,
            date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            type: 'PDF',
            by: 'You',
            typePill: reportType === 'vaccination' ? 'blue' : reportType === 'growth' ? 'green' : 'teal',
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error('Failed to process report:', error);
      alert('Error processing report. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const pillColor = (type) => {
    const map = {
      teal: { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
      blue: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
      green: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
      amber: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    };
    return map[type] || map.teal;
  };

  const filteredHistory = reportHistory.filter((row) => filterType === 'all' || row.typePill === filterType);

  return (
    <div className="reports-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Libre+Baskerville:wght@400;700&display=swap');

        .reports-page-wrapper {
          min-height: 100vh;
          background: #f0fdff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0c2340;
        }

        /* --- Navbar Styles --- */
        .sa-navbar {
          position: sticky; top: 0; z-index: 1000;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          height: 68px;
          border-bottom: 2px solid #cffafe;
          box-shadow: 0 4px 20px rgba(8, 145, 178, 0.08);
          display: flex; align-items: center;
          padding: 0 24px;
          gap: 20px;
        }

        .sa-logo-box {
          display: flex; align-items: center; gap: 12px; flex-shrink: 0;
          text-decoration: none;
        }

        .sa-logo-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: linear-gradient(135deg, #0891b2, #0e7490);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; color: #fff;
          box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
        }

        .sa-logo-text {
          font-family: 'Libre Baskerville', serif;
          font-weight: 700; font-size: 18px; color: #0e7490; line-height: 1;
        }

        .sa-logo-tag {
          font-size: 10px; color: #4a7a8a; font-weight: 500; margin-top: 2px;
          letter-spacing: 0.02em;
        }

        .sa-nav-links {
          display: flex; align-items: center; gap: 4px; flex: 1;
          justify-content: center;
        }

        .sa-nav-item {
          padding: 8px 14px; border-radius: 10px;
          font-size: 13.5px; font-weight: 500; color: #4a7a8a;
          text-decoration: none; transition: all 0.2s;
          white-space: nowrap;
        }

        .sa-nav-item:hover { background: #e0f7fa; color: #0891b2; }
        .sa-nav-item.active { 
          background: #0891b2; color: #fff; 
          box-shadow: 0 4px 12px rgba(8, 145, 178, 0.2);
        }

        .sa-navbar-right {
          display: flex; align-items: center; gap: 16px; margin-left: auto;
        }

        .sa-nav-circle {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, #0891b2, #0e7490);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 15px;
          text-decoration: none; border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        /* --- Existing Styles --- */
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .spinner { width: 24px; height: 24px; border: 3.5px solid rgba(14, 165, 233, 0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }

        .hero { position: relative; height: 320px; overflow: hidden; margin: 20px 40px; border-radius: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.4) 100%); }
        .hero-content { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 20px; color: #fff; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(4px); color: #fff; font-size: 0.75rem; font-weight: 700; padding: 6px 16px; border-radius: 100px; border: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .hero-title { font-family: 'Outfit', sans-serif; font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 800; line-height: 1.1; }
        .hero-title span { background: linear-gradient(to right, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        main { max-width: 1400px; margin: 0 auto; padding: 40px; }
        .section-header { margin-bottom: 32px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .section-title-wrap h2 { font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px; }
        .section-title-wrap p { color: var(--text-muted); font-size: 0.95rem; }

        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 24px; border-radius: 16px; font-size: 0.875rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); text-decoration: none; position: relative; overflow: hidden; }
        .btn-primary { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2); }
        .btn-white { background: #fff; color: var(--text-main); border: 1px solid #e2e8f0; }
        .btn-sm { padding: 8px 18px; font-size: 0.75rem; border-radius: 10px; }
        .btn-loading { pointer-events: none; opacity: 0.8; }

        .control-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 24px; padding: 24px; margin-bottom: 40px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; box-shadow: 0 15px 35px rgba(0,0,0,0.03); }
        .child-select-wrap { display: flex; align-items: center; gap: 16px; }
        .pretty-select { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px 20px; font-size: 0.95rem; font-weight: 600; cursor: pointer; min-width: 200px; }

        .reports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; margin-bottom: 50px; }
        .report-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 28px; padding: 32px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .report-card:hover { transform: translateY(-12px); box-shadow: 0 30px 60px rgba(0,0,0,0.08); }
        .card-icon { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; background: #fff; border: 1px solid #e2e8f0; }
        .card-meta { display: flex; align-items: center; gap: 12px; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .meta-pill { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 8px; background: #f1f5f9; color: #475569; }

        .history-section { background: #fff; border-radius: 32px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.02); }
        .history-header { padding: 32px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
        .premium-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .premium-table th { background: #f8fafc; padding: 18px 32px; text-align: left; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        .premium-table td { padding: 20px 32px; border-bottom: 1px solid #e2e8f0; font-size: 0.95rem; font-weight: 500; }
        .history-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; border: 1px solid transparent; }

        @media print {
          .sa-navbar, .hero, .section-header, .control-panel, .card-meta, .btn, footer { display: none !important; }
          main { margin: 0; padding: 0; }
        }
      `}</style>

      <nav className="sa-navbar">
        <Link className="sa-logo-box" to="/parent/dashboard">
          <div className="sa-logo-icon">🏥</div>
          <div>
            <div className="sa-logo-text">Shishu Aarogya</div>
            <div className="sa-logo-tag">National Child Health Portal</div>
          </div>
        </Link>

        <div className="sa-nav-links">
          {(navLinks && navLinks.length ? navLinks : NAV).map(([label, to]) => (
            <Link 
              key={to} 
              to={to} 
              className={`sa-nav-item ${location.pathname === to ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="sa-navbar-right">
          <Link to="/parent/notifications" style={{ textDecoration: 'none', fontSize: '20px', color: '#4a7a8a' }}>🔔</Link>
          <Link to="/parent/settings" className="sa-nav-circle">{userInitial}</Link>
        </div>
      </nav>

      <section className="hero">
        <MediaCarousel currentSlideIndex={slide} />
        <div className="hero-overlay" />
        <div className="hero-content slide-up">
          <span className="hero-badge">✨ Intelligence Portal</span>
          <h1 className="hero-title">Your Child's <span>Health Intelligence</span></h1>
          <p style={{ marginTop: '16px', fontSize: '1.1rem', opacity: 0.9 }}>Secure, certified health reports at your fingertips.</p>
        </div>
      </section>

      <main>
        {loading ? (
          <div style={{ height: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <div className="spinner" style={{ width: '48px', height: '48px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Synchronizing Health Data...</p>
          </div>
        ) : children.length === 0 ? (
          <div className="empty-state slide-up">
            <div className="empty-illustration">📂</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>No Child Profile Detected</h2>
            <p style={{ maxWidth: '400px', color: 'var(--text-muted)' }}>Please register your child in the "My Child" section to begin generating detailed health analytical reports.</p>
            <Link to="/parent/child-profile" className="btn btn-primary">Add Child Profile</Link>
          </div>
        ) : (
          <>
            <div className="section-header slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="section-title-wrap">
                <h2>📑 Health Reports</h2>
                <p>Generate certified reports based on active health records.</p>
              </div>
              {selectedChild && (
                <button
                  className={`btn btn-primary ${downloading === `${selectedChild._id}-comprehensive-download` ? 'btn-loading' : ''}`}
                  onClick={() => handleReportAction(selectedChild._id, selectedChild.name, 'comprehensive', 'Full Health Summary', 'download')}
                  disabled={!!downloading}
                >
                  {downloading === `${selectedChild._id}-comprehensive-download` ? <span className="spinner" style={{ borderTopColor: '#fff', width: '16px', height: '16px' }} /> : '📥 Download All Data'}
                </button>
              )}
            </div>

            <div className="control-panel slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="child-select-wrap">
                <label>Monitoring Child:</label>
                <select className="pretty-select" value={selectedChildId} onChange={(e) => setSelectedChild(e.target.value)}>
                  {children.map((child) => <option key={child._id} value={child._id}>{child.name}</option>)}
                </select>
                {selectedChild && (
                  <div style={{ padding: '4px 12px', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {`${selectedChild.ageInMonths || 0}m · ${selectedChild.gender.charAt(0).toUpperCase() + selectedChild.gender.slice(1)}`}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Reports: 3</span>
              </div>
            </div>

            <div className="reports-grid">
              {REPORT_TYPES.map((report, i) => (
                <div 
                  key={report.id} 
                  className="report-card slide-up" 
                  style={{ animationDelay: `${0.3 + i * 0.1}s`, '--accent-color': report.accent }}
                >
                  <div className="card-icon" style={{ borderColor: `${report.accent}20` }}>{report.icon}</div>
                  <div className="card-content">
                    <h3>{report.title}</h3>
                    <p>{report.subtitle}. This report provides a detailed view of {report.id} benchmarks and status.</p>
                    <div className="card-meta">
                      <span className="meta-pill">{report.meta}</span>
                      <span className="meta-pill" style={{ background: `${report.accent}10`, color: report.accent }}>Verified PDF</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    <button
                      className={`btn btn-primary btn-sm ${downloading === `${selectedChild?._id}-${report.id}-download` ? 'btn-loading' : ''}`}
                      style={{ background: report.accent, boxShadow: `0 8px 16px ${report.accent}30` }}
                      onClick={() => selectedChild && handleReportAction(selectedChild._id, selectedChild.name, report.id, report.title, 'download')}
                      disabled={!!downloading}
                    >
                      {downloading === `${selectedChild?._id}-${report.id}-download` ? <span className="spinner" style={{ borderTopColor: '#fff', width: '12px', height: '12px' }} /> : 'Download'}
                    </button>
                    <button
                      className={`btn btn-white btn-sm ${downloading === `${selectedChild?._id}-${report.id}-preview` ? 'btn-loading' : ''}`}
                      onClick={() => selectedChild && handleReportAction(selectedChild._id, selectedChild.name, report.id, report.title, 'preview')}
                      disabled={!!downloading}
                    >
                      {downloading === `${selectedChild?._id}-${report.id}-preview` ? <span className="spinner" style={{ width: '12px', height: '12px' }} /> : 'Preview'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="history-section slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="history-header">
                <h3>📂 Generated Report Vault</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className={`btn btn-white btn-sm ${showFilter ? 'btn-primary' : ''}`} onClick={() => setShowFilter(!showFilter)}>
                    {showFilter ? 'Close Filter' : 'Filter Reports'}
                  </button>
                  {showFilter && (
                    <select className="pretty-select" style={{ minWidth: '150px', padding: '6px 12px' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                      <option value="all">All Categories</option>
                      <option value="teal">Comprehensive</option>
                      <option value="blue">Vaccination</option>
                      <option value="green">Growth</option>
                    </select>
                  )}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Generation Date</th>
                      <th>Category</th>
                      <th>Auth</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📄</div>
                          No internal history. Generated reports will appear here securely.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((row, idx) => {
                        const style = pillColor(row.typePill);
                        const type = row.typePill === 'blue' ? 'vaccination' : row.typePill === 'green' ? 'growth' : 'comprehensive';
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700 }}>{row.name}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{row.date}</td>
                            <td>
                              <span className="history-pill" style={{ background: style.bg, color: style.color, borderColor: style.border }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.color }} />
                                {row.typePill === 'blue' ? 'Vaccination' : row.typePill === 'green' ? 'Growth' : 'Comprehensive'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Digital Signature</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className={`btn btn-white btn-sm ${downloading === `${selectedChild?._id}-${type}-preview` ? 'btn-loading' : ''}`}
                                  style={{ padding: '6px 12px' }}
                                  onClick={() => selectedChild && handleReportAction(selectedChild._id, selectedChild.name, type, row.name.split(' — ')[1], 'preview')}
                                  disabled={!!downloading}
                                >
                                  {downloading === `${selectedChild?._id}-${type}-preview` ? <span className="spinner" style={{ width: '12px', height: '12px' }} /> : 'View'}
                                </button>
                                <button
                                  className={`btn btn-primary btn-sm ${downloading === `${selectedChild?._id}-${type}-download` ? 'btn-loading' : ''}`}
                                  style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                                  onClick={() => selectedChild && handleReportAction(selectedChild._id, selectedChild.name, type, row.name.split(' — ')[1], 'download')}
                                  disabled={!!downloading}
                                >
                                  {downloading === `${selectedChild?._id}-${type}-download` ? <span className="spinner" style={{ borderTopColor: '#fff', width: '12px', height: '12px' }} /> : '📥'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <footer style={{ background: '#0e7490', color: 'rgba(255,255,255,.45)', textAlign: 'center', padding: '24px 20px', fontSize: 13, borderTop: '5px solid #0891b2' }}>
        <p style={{ fontWeight: 700, marginBottom: '8px', color: '#fff', fontFamily: "'Libre Baskerville', serif" }}>Shishu Aarogya</p>
        <p style={{ opacity: 0.85 }}>{t('homeFooter_copyright_long') || 'National Child Health Portal · Government of India'}</p>
        <p style={{ marginTop: '16px', fontSize: '0.75rem', opacity: 0.6 }}>&copy; 2024 Ministry of Health & Family Welfare. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

