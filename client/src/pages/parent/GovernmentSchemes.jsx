import React, { useEffect, useRef, useState } from 'react';
import { schemeAPI } from '../../services/api';

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

const STATIC_SCHEMES = [
  {
    _id: 'static-1',
    icon: '🍼',
    name: 'Integrated Child Development Services',
    shortName: 'ICDS',
    description: 'Free supplementary nutrition, immunization, health check-ups, and pre-school education for children under 6 years and pregnant/lactating mothers.',
    tags: ['Nutrition', 'Immunization', 'Health Check-up', 'Pre-school'],
    isEnrolled: true,
    enrolledStatus: 'Active since Jan 2024',
    borderColor: '#059669',
    category: 'nutrition',
  },
  {
    _id: 'static-2',
    icon: '💰',
    name: 'Pradhan Mantri Matru Vandana Yojana',
    shortName: 'PMMVY',
    description: '₹5,000 cash benefit provided in 3 installments for pregnant and lactating mothers to compensate for wage loss and improve health-seeking behavior.',
    tags: ['Cash Benefit', '₹5,000', '3 Installments', 'Maternity'],
    isEnrolled: true,
    enrolledStatus: '₹3,000 received · ₹2,000 pending',
    borderColor: '#f59e0b',
    category: 'financial',
  },
  {
    _id: 'static-3',
    icon: '🏥',
    name: 'Janani Suraksha Yojana',
    shortName: 'JSY',
    description: 'Cash assistance for institutional delivery. Rural beneficiaries receive ₹1,400 and urban beneficiaries receive ₹1,000 to promote safe deliveries.',
    tags: ['Cash Assistance', '₹1,400', 'Institutional Delivery', 'Rural'],
    isEnrolled: true,
    enrolledStatus: 'Payment disbursed ✓',
    borderColor: '#1d4ed8',
    category: 'vaccination',
  },
  {
    _id: 'static-4',
    icon: '👧',
    name: 'Sukanya Samriddhi Yojana',
    shortName: 'SSY',
    description: 'Girl Child Savings Scheme — tax-free returns up to 8.2% p.a. Deposit between ₹250–₹1.5 lakh per year for a girl child under 10 years.',
    tags: ['Girl Child', '8.2% p.a.', 'Tax-free', 'Savings'],
    isEnrolled: false,
    borderColor: '#7c3aed',
    category: 'financial',
  },
  {
    _id: 'static-5',
    icon: '🩺',
    name: 'Ayushman Bharat — PMJAY',
    shortName: 'PMJAY',
    description: '₹5 lakh health insurance coverage per family per year for secondary and tertiary care hospitalization at empaneled public and private hospitals.',
    tags: ['₹5 Lakh Cover', 'Hospitalization', '25,000+ Hospitals', 'Free'],
    isEnrolled: false,
    borderColor: '#0891b2',
    category: 'other',
  },
];

function isEnrolledScheme(scheme) {
  if (scheme.isEnrolled) return true;
  if (scheme.category === 'nutrition' || scheme.category === 'vaccination') return true;
  return false;
}

function schemeColor(scheme) {
  if (scheme.borderColor) return scheme.borderColor;
  const map = {
    nutrition: '#059669',
    vaccination: '#1d4ed8',
    financial: '#f59e0b',
    education: '#7c3aed',
    other: '#0891b2',
  };
  return map[scheme.category] || '#0891b2';
}

export default function GovernmentSchemes() {
  const [slide, setSlide] = useState(0);
  const slideRef = useRef(0);
  const [apiSchemes, setApiSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(null); // scheme object

  const handleCheckStatus = (scheme) => setStatusModal(scheme);
  const handleCheckEligibility = (scheme) => {
    if (scheme.applyLink) {
      window.open(scheme.applyLink, '_blank', 'noopener,noreferrer');
    } else {
      setStatusModal(scheme);
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      slideRef.current = (slideRef.current + 1) % SLIDES.length;
      setSlide(slideRef.current);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    schemeAPI.list()
      .then(r => setApiSchemes(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const enrolledSchemes = STATIC_SCHEMES.filter(isEnrolledScheme);
  const applySchemes = STATIC_SCHEMES.filter(s => !isEnrolledScheme(s));
  const dynamicSchemes = apiSchemes.filter(s => !STATIC_SCHEMES.some(ss => ss.shortName === s.shortName || ss.name === s.name));

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
        .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; }
        .page-header h2 { font-family: 'Libre Baskerville', serif; font-size: 1.35rem; font-weight: 700; color: var(--text); }
        .section-label { font-family: 'Libre Baskerville', serif; font-size: 1rem; font-weight: 700; color: var(--text); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .section-label .pill { font-family: 'DM Sans', sans-serif; font-size: .72rem; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
        .pill-green { background: #d1fae5; color: #059669; }
        .pill-blue { background: #dbeafe; color: #1d4ed8; }
        .schemes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-bottom: 32px; }
        .scheme-card { background: #fff; border: 1.5px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(8,145,178,.07); transition: transform .15s, box-shadow .15s; }
        .scheme-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(8,145,178,.12); }
        .scheme-header { display: flex; align-items: center; gap: 12px; padding: 16px 18px 14px; border-bottom: 1px solid var(--border); }
        .scheme-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
        .scheme-name { font-weight: 700; font-size: .96rem; color: var(--text); margin-bottom: 3px; line-height: 1.3; }
        .scheme-short { font-size: .72rem; font-weight: 600; padding: 2px 8px; border-radius: 6px; display: inline-block; }
        .enrolled-pill { background: #d1fae5; color: #059669; font-size: .7rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-left: auto; flex-shrink: 0; }
        .apply-pill { background: #dbeafe; color: #1d4ed8; font-size: .7rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-left: auto; flex-shrink: 0; }
        .scheme-body { padding: 14px 18px 16px; }
        .scheme-desc { font-size: .84rem; color: var(--muted); line-height: 1.6; margin-bottom: 12px; }
        .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .tag { background: var(--teal4); color: var(--teal2); font-size: .72rem; font-weight: 600; padding: 3px 10px; border-radius: 20px; border: 1px solid var(--border); }
        .enrolled-box { background: #d1fae5; border-radius: 8px; padding: 8px 12px; font-size: .8rem; color: #065f46; font-weight: 500; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
        .info-box { background: var(--teal4); border-radius: 8px; padding: 8px 12px; font-size: .8rem; color: var(--teal2); font-weight: 500; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 9px; font-size: .82rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: filter .15s, transform .1s; }
        .btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .btn-teal { background: var(--teal); color: #fff; }
        .btn-outline { background: #fff; color: var(--teal2); border: 1.5px solid var(--border); }
        .btn-green { background: #059669; color: #fff; }
        .divider { border: none; border-top: 1.5px solid var(--border); margin: 28px 0; }
        .dynamic-section { margin-bottom: 32px; }
        .dynamic-card { background: #fff; border: 1.5px solid var(--border); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
        .dynamic-card-title { font-weight: 700; font-size: .96rem; margin-bottom: 6px; }
        .dynamic-card-desc { font-size: .84rem; color: var(--muted); margin-bottom: 8px; }
        .contact-banner { background: linear-gradient(135deg, var(--teal) 0%, var(--teal2) 100%); border-radius: 16px; padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px; margin-bottom: 24px; }
        .contact-text h3 { font-family: 'Libre Baskerville', serif; font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .contact-text p { font-size: .86rem; color: rgba(255,255,255,.85); }
        .btn-white { background: #fff; color: var(--teal2); }
        footer.footbar { background: var(--teal2); color: rgba(255,255,255,.9); text-align: center; padding: 18px 24px; font-size: .8rem; }
        @media (max-width: 768px) {
          nav.topnav .navlinks { display: none; }
          .schemes-grid { grid-template-columns: 1fr; }
          .contact-banner { flex-direction: column; text-align: center; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="topnav">
        <a className="nav-brand" href="/parent/dashboard">🌿 Sishu Arogaya</a>
        <div className="navlinks">
          {NAV.map(([label, href]) => (
            <a key={href} href={href} className={href === '/parent/schemes' ? 'active' : ''}>{label}</a>
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
          <span className="hero-badge">🏥 Government Schemes</span>
          <h1 className="hero-title">Welfare Schemes for <span>Your Family</span></h1>
        </div>
      </section>

      <main>
        <div className="page-header">
          <h2>🏛️ Government Welfare Schemes</h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="spinner" />
            <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: '.9rem' }}>Loading schemes…</p>
          </div>
        ) : (
          <>
            {/* Currently Enrolled */}
            <div className="section-label fade-up">
              ✓ Currently Enrolled
              <span className="pill pill-green">{enrolledSchemes.length} Active</span>
            </div>
            <div className="schemes-grid">
              {enrolledSchemes.map(scheme => {
                const color = schemeColor(scheme);
                return (
                  <div key={scheme._id} className="scheme-card fade-up" style={{ borderTop: `4px solid ${color}` }}>
                    <div className="scheme-header">
                      <div className="scheme-icon" style={{ background: color + '18' }}>{scheme.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="scheme-name">{scheme.name}</div>
                        <span className="scheme-short" style={{ background: color + '18', color }}>{scheme.shortName}</span>
                      </div>
                      <span className="enrolled-pill">✓ Enrolled</span>
                    </div>
                    <div className="scheme-body">
                      <p className="scheme-desc">{scheme.description}</p>
                      {scheme.tags && (
                        <div className="tags">
                          {scheme.tags.map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                      )}
                      {scheme.enrolledStatus && (
                        <div className="enrolled-box">
                          <span>✅</span>
                          <span>{scheme.enrolledStatus}</span>
                        </div>
                      )}
                      <button className="btn btn-green" onClick={() => handleCheckStatus(scheme)}>Check Status →</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <hr className="divider" />

            {/* Apply Now */}
            <div className="section-label fade-up">
              🎯 Apply Now — You're Eligible
              <span className="pill pill-blue">{applySchemes.length} Available</span>
            </div>
            <div className="schemes-grid">
              {applySchemes.map(scheme => {
                const color = schemeColor(scheme);
                return (
                  <div key={scheme._id} className="scheme-card fade-up" style={{ borderTop: `4px solid ${color}` }}>
                    <div className="scheme-header">
                      <div className="scheme-icon" style={{ background: color + '18' }}>{scheme.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="scheme-name">{scheme.name}</div>
                        <span className="scheme-short" style={{ background: color + '18', color }}>{scheme.shortName}</span>
                      </div>
                      <span className="apply-pill">Apply Now</span>
                    </div>
                    <div className="scheme-body">
                      <p className="scheme-desc">{scheme.description}</p>
                      {scheme.tags && (
                        <div className="tags">
                          {scheme.tags.map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                      )}
                      <div className="info-box">
                        <span>ℹ️</span>
                        <span>You may be eligible based on your profile. Contact your ASHA worker to apply.</span>
                      </div>
                      <button className="btn btn-teal" onClick={() => handleCheckEligibility(scheme)}>Check Eligibility →</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic API schemes */}
            {dynamicSchemes.length > 0 && (
              <>
                <hr className="divider" />
                <div className="section-label fade-up">
                  🔄 Additional Schemes
                  <span className="pill pill-blue">{dynamicSchemes.length}</span>
                </div>
                <div className="schemes-grid">
                  {dynamicSchemes.map(scheme => {
                    const color = schemeColor(scheme);
                    const enrolled = isEnrolledScheme(scheme);
                    return (
                      <div key={scheme._id} className="scheme-card fade-up" style={{ borderTop: `4px solid ${color}` }}>
                        <div className="scheme-header">
                          <div className="scheme-icon" style={{ background: color + '18', fontSize: '1.3rem' }}>🏛️</div>
                          <div style={{ flex: 1 }}>
                            <div className="scheme-name">{scheme.name}</div>
                            {scheme.shortName && <span className="scheme-short" style={{ background: color + '18', color }}>{scheme.shortName}</span>}
                          </div>
                          {enrolled ? <span className="enrolled-pill">✓ Enrolled</span> : <span className="apply-pill">Apply Now</span>}
                        </div>
                        <div className="scheme-body">
                          <p className="scheme-desc">{scheme.description}</p>
                          {scheme.eligibilityCriteria && (
                            <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 8 }}>
                              <strong>Eligibility:</strong> {scheme.eligibilityCriteria}
                            </div>
                          )}
                          {scheme.benefits && (
                            <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 10 }}>
                              <strong>Benefits:</strong> {scheme.benefits}
                            </div>
                          )}
                          {scheme.applyLink
                            ? <a href={scheme.applyLink} target="_blank" rel="noreferrer" className="btn btn-teal">Check Eligibility →</a>
                            : <button className="btn btn-outline">Check Eligibility →</button>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ASHA Contact Banner */}
            <div className="contact-banner fade-up">
              <div className="contact-text">
                <h3>📞 Need Help Applying?</h3>
                <p>Your assigned ASHA worker can help you enroll in any of these schemes. Contact them directly for assistance with applications and documentation.</p>
                <p style={{ marginTop: 6, fontWeight: 600, color: '#cffafe' }}>ASHA Helpline: 1800-180-1104 · Mon–Sat, 9 AM – 6 PM</p>
              </div>
              <a href="tel:18001801104" className="btn btn-white">📞 Call Now</a>
            </div>
          </>
        )}
      </main>

      {/* Status / Eligibility Modal */}
      {statusModal && (
        <div
          onClick={() => setStatusModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.2)', position: 'relative' }}
          >
            <button onClick={() => setStatusModal(null)} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#4a7a8a' }}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 28 }}>{statusModal.icon || '🏛️'}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0c2340' }}>{statusModal.name}</div>
                {statusModal.shortName && <div style={{ fontSize: 12, color: '#0891b2', fontWeight: 600 }}>{statusModal.shortName}</div>}
              </div>
            </div>
            {statusModal.enrolledStatus && (
              <div style={{ background: '#d1fae5', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#065f46', fontWeight: 600 }}>
                ✅ Status: {statusModal.enrolledStatus}
              </div>
            )}
            {statusModal.eligibilityCriteria && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4a7a8a', textTransform: 'uppercase', marginBottom: 4 }}>Eligibility</div>
                <div style={{ fontSize: 13, color: '#0c2340', lineHeight: 1.6 }}>{statusModal.eligibilityCriteria}</div>
              </div>
            )}
            {statusModal.benefits && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4a7a8a', textTransform: 'uppercase', marginBottom: 4 }}>Benefits</div>
                <div style={{ fontSize: 13, color: '#0c2340', lineHeight: 1.6 }}>{statusModal.benefits}</div>
              </div>
            )}
            <p style={{ fontSize: 13, color: '#4a7a8a', marginBottom: 16, lineHeight: 1.6 }}>{statusModal.description}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {statusModal.applyLink && (
                <a href={statusModal.applyLink} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: '#0891b2', color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                  🔗 Apply / Check Online
                </a>
              )}
              <button onClick={() => setStatusModal(null)}
                style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid #c5e8ef', background: '#fff', color: '#0e7490', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footbar">
        Sishu Arogaya © 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
      </footer>
    </>
  );
}
