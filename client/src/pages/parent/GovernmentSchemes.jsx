import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { schemeAPI } from '../../services/api';
import MediaCarousel, { MEDIA_ARRAY } from '../../components/MediaCarousel';
import { useLanguage } from '../../context/LanguageContext';



// navLinks moved to component body using useLanguage()

const CATEGORY_COLOR = {
  nutrition:   '#059669',
  vaccination: '#1d4ed8',
  financial:   '#f59e0b',
  education:   '#7c3aed',
  other:       '#0891b2',
};

const CATEGORY_LABEL = {
  nutrition:   '🥗 Nutrition',
  vaccination: '💉 Vaccination',
  financial:   '💰 Financial',
  education:   '📚 Education',
  other:       '🏛️ Other',
};

function schemeColor(s) {
  return CATEGORY_COLOR[s.category] || '#0891b2';
}

export default function GovernmentSchemes() {
  const { navLinks, t } = useLanguage();
  const [slide,       setSlide]       = useState(0);
  const slideRef                      = useRef(0);
  const [schemes,     setSchemes]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [filter,      setFilter]      = useState('all');
  const [modal,       setModal]       = useState(null);  // scheme object for detail modal

  /* ── auto-slide ── */
  useEffect(() => {
    const id = setInterval(() => {
      slideRef.current = (slideRef.current + 1) % MEDIA_ARRAY.length;
      setSlide(slideRef.current);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  /* ── fetch schemes from backend ── */
  useEffect(() => {
    schemeAPI.list()
      .then(r => {
        const data = r.data || [];
        setSchemes(data);
        setError('');
      })
      .catch(() => setError('Could not load schemes from server. Showing cached data.'))
      .finally(() => setLoading(false));
  }, []);

  /* ── filter ── */
  const displayed = filter === 'all' ? schemes : schemes.filter(s => s.category === filter);

  const openModal = (scheme) => setModal(scheme);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f8fffe; color: #0c2340; }
        :root {
          --teal: #0891b2; --teal2: #0e7490; --teal3: #cffafe; --teal4: #f0fdff;
          --bg: #f8fffe; --text: #0c2340; --muted: #4a7a8a; --border: #c5e8ef;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes spin   { to { transform:rotate(360deg); } }
        .fade-up  { animation: fadeUp .45s ease both; }
        .spinner  { width:38px; height:38px; border:3px solid var(--teal3); border-top-color:var(--teal); border-radius:50%; animation:spin .8s linear infinite; margin:0 auto; }

        /* nav */
        nav.topnav { position:sticky; top:0; z-index:100; background:#fff; height:64px; display:flex; align-items:center; box-shadow:0 2px 8px rgba(8,145,178,.08); border-bottom:2px solid #cffafe; padding:0 28px; gap:0; }
        .nav-brand  { font-family:'Libre Baskerville',serif; font-size:1.18rem; font-weight:700; color:var(--teal2); margin-right:32px; white-space:nowrap; text-decoration:none; }
        .navlinks   { display:flex; gap:2px; flex-wrap:nowrap; overflow-x:auto; }
        .navlinks a { font-size:.82rem; font-weight:500; color:var(--muted); padding:6px 11px; border-radius:7px; text-decoration:none; white-space:nowrap; transition:background .15s,color .15s; }
        .navlinks a:hover  { background:var(--teal4); color:var(--teal2); }
        .navlinks a.active { background:var(--teal3); color:var(--teal2); font-weight:600; }

        /* hero */
        .hero { position:relative; height:220px; overflow:hidden; }
        .hero-slide   { position:absolute; inset:0; background-size:cover; background-position:center; transition:opacity .8s ease; }
        .hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(8,145,178,.82) 0%,rgba(14,116,144,.72) 100%); }
        .hero-content { position:relative; z-index:2; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 20px; }
        .hero-badge   { display:inline-block; background:rgba(255,255,255,.18); color:#fff; font-size:.78rem; font-weight:600; padding:4px 14px; border-radius:20px; border:1px solid rgba(255,255,255,.35); margin-bottom:10px; }
        .hero-title   { font-family:'Libre Baskerville',serif; font-size:clamp(1.3rem,3.5vw,2rem); font-weight:700; color:#fff; }
        .hero-title span { color:#cffafe; }

        /* layout */
        main { max-width:1280px; margin:0 auto; padding:28px 20px 56px; }

        /* filter bar */
        .filter-bar { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:28px; }
        .filter-btn { padding:7px 18px; border-radius:20px; border:1.5px solid var(--border); background:#fff; color:var(--muted); font-size:.82rem; font-weight:600; cursor:pointer; transition:all .15s; }
        .filter-btn:hover  { background:var(--teal4); color:var(--teal2); border-color:var(--teal3); }
        .filter-btn.active { background:var(--teal); color:#fff; border-color:var(--teal); }

        /* grid */
        .schemes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:20px; }

        /* card */
        .scheme-card { background:#fff; border:1.5px solid var(--border); border-radius:16px; overflow:hidden; box-shadow:0 2px 10px rgba(8,145,178,.07); transition:transform .15s,box-shadow .15s; display:flex; flex-direction:column; }
        .scheme-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(8,145,178,.14); }
        .card-top  { display:flex; align-items:flex-start; gap:12px; padding:18px 18px 12px; }
        .card-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0; }
        .card-meta { flex:1; min-width:0; }
        .card-name { font-weight:700; font-size:.97rem; color:var(--text); line-height:1.3; margin-bottom:4px; }
        .card-badges { display:flex; flex-wrap:wrap; gap:4px; }
        .badge-short { font-size:.7rem; font-weight:700; padding:2px 8px; border-radius:6px; }
        .badge-cat   { font-size:.7rem; font-weight:600; padding:2px 8px; border-radius:6px; background:#f1f5f9; color:#64748b; }
        .card-body { padding:0 18px 16px; flex:1; display:flex; flex-direction:column; }
        .card-desc { font-size:.84rem; color:var(--muted); line-height:1.65; margin-bottom:10px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
        .card-tags { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px; }
        .tag { background:var(--teal4); color:var(--teal2); font-size:.7rem; font-weight:600; padding:3px 9px; border-radius:20px; border:1px solid var(--border); }
        .card-footer { display:flex; gap:8px; margin-top:auto; }

        /* buttons */
        .btn { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:9px; font-size:.82rem; font-weight:600; cursor:pointer; border:none; text-decoration:none; transition:filter .15s,transform .1s; white-space:nowrap; }
        .btn:hover { filter:brightness(1.07); transform:translateY(-1px); }
        .btn-primary { background:var(--teal); color:#fff; }
        .btn-outline { background:#fff; color:var(--teal2); border:1.5px solid var(--border); }
        .btn-green   { background:#059669; color:#fff; }
        .btn-purple  { background:#7c3aed; color:#fff; }
        .btn-amber   { background:#d97706; color:#fff; }

        /* info/contact banner */
        .info-banner { background:linear-gradient(135deg,var(--teal) 0%,var(--teal2) 100%); border-radius:16px; padding:28px 32px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-top:40px; }
        .info-banner h3 { font-family:'Libre Baskerville',serif; font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:4px; }
        .info-banner p  { font-size:.86rem; color:rgba(255,255,255,.88); }
        .btn-white { background:#fff; color:var(--teal2); }

        /* modal backdrop */
        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .modal-box { background:#fff; border-radius:18px; padding:28px; max-width:520px; width:100%; box-shadow:0 24px 64px rgba(0,0,0,.22); position:relative; max-height:90vh; overflow-y:auto; }
        .modal-close { position:absolute; top:14px; right:16px; background:none; border:none; font-size:20px; cursor:pointer; color:#4a7a8a; line-height:1; }
        .modal-title { font-weight:700; font-size:1.1rem; color:var(--text); margin-bottom:4px; }
        .modal-short { font-size:.78rem; font-weight:600; color:var(--teal); margin-bottom:14px; display:block; }
        .modal-section-label { font-size:.72rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px; margin-top:12px; }
        .modal-section-text  { font-size:.88rem; color:var(--text); line-height:1.7; }
        .modal-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:20px; }

        @media (max-width:640px) {
          nav.topnav .navlinks { display:none; }
          .schemes-grid { grid-template-columns:1fr; }
          .info-banner  { flex-direction:column; text-align:center; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="topnav">
        <Link className="nav-brand" to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
           <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 16, color: '#fff' }}>🏥</div>
           <div>
             <div style={{ fontSize: 17 }}>Shishu Aarogya</div>
             <div style={{ fontSize: 9, fontWeight: 500, color: '#4a7a8a', fontFamily: 'sans-serif' }}>National Child Health Portal</div>
           </div>
        </Link>
        <div className="navlinks">
          {(navLinks && navLinks.length ? navLinks : NAV).map(([label, to]) => (
            <Link key={to} to={to} className={to === '/parent/schemes' ? 'active' : ''}>{label}</Link>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <MediaCarousel currentSlideIndex={slide} />
        <div className="hero-overlay" />
        <div className="hero-content fade-up">
          <span className="hero-badge">🏛️ Government Schemes</span>
          <h1 className="hero-title">Welfare Schemes for <span>Your Family</span></h1>
        </div>
      </section>

      <main>
        {/* error */}
        {error && (
          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'10px 16px', marginBottom:20, fontSize:'.85rem', color:'#c2410c' }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding:'60px 0', textAlign:'center' }}>
            <div className="spinner" />
            <p style={{ marginTop:14, color:'var(--muted)', fontSize:'.9rem' }}>Loading schemes from database…</p>
          </div>
        ) : (
          <>
            {/* Count + Filter bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
              <h2 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:'1.25rem', fontWeight:700, color:'var(--text)' }}>
                🏛️ {schemes.length} Government Welfare Schemes
              </h2>
              <span style={{ fontSize:'.82rem', color:'var(--muted)' }}>Live data from database</span>
            </div>

            <div className="filter-bar">
              {[['all','All Schemes','📍'],['nutrition','Nutrition','🥗'],['vaccination','Vaccination','💉'],['financial','Financial','💰'],['education','Education','📚'],['other','Other','🏛️']].map(([key,label,emoji]) => (
                <button key={key} className={`filter-btn${filter===key?' active':''}`} onClick={() => setFilter(key)}>
                  {emoji} {label}
                </button>
              ))}
            </div>

            {displayed.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 0', color:'var(--muted)' }}>
                No schemes found for this category.
              </div>
            ) : (
              <div className="schemes-grid">
                {displayed.map((scheme, idx) => {
                  const color = schemeColor(scheme);
                  const hasLink = !!scheme.applyLink;
                  return (
                    <div key={scheme._id} className="scheme-card fade-up" style={{ borderTop:`4px solid ${color}`, animationDelay:`${idx * 0.05}s` }}>
                      <div className="card-top">
                        <div className="card-icon" style={{ background:`${color}18` }}>
                          {scheme.icon || '🏛️'}
                        </div>
                        <div className="card-meta">
                          <div className="card-name">{scheme.name}</div>
                          <div className="card-badges">
                            {scheme.shortName && (
                              <span className="badge-short" style={{ background:`${color}18`, color }}>{scheme.shortName}</span>
                            )}
                            <span className="badge-cat">{CATEGORY_LABEL[scheme.category] || scheme.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="card-body">
                        <p className="card-desc">{scheme.description}</p>

                        {scheme.tags?.length > 0 && (
                          <div className="card-tags">
                            {scheme.tags.map(t => <span key={t} className="tag">{t}</span>)}
                          </div>
                        )}

                        <div className="card-footer">
                          {/* Primary CTA — opens official government portal */}
                          {hasLink ? (
                            <a
                              href={scheme.applyLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary"
                              style={{ flex:1, justifyContent:'center' }}
                            >
                              Apply / Check Online 🔗
                            </a>
                          ) : (
                            <button
                              className="btn btn-primary"
                              style={{ flex:1, justifyContent:'center' }}
                              onClick={() => openModal(scheme)}
                            >
                              Check Eligibility →
                            </button>
                          )}
                          {/* Details button */}
                          <button
                            className="btn btn-outline"
                            onClick={() => openModal(scheme)}
                            title="View full details"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ASHA / Helpline Banner */}
            <div className="info-banner fade-up">
              <div>
                <h3>📞 Need Help Applying?</h3>
                <p>Your ASHA worker can help you enroll in any scheme. Contact them or call the national helpline.</p>
                <p style={{ marginTop:6, fontWeight:600, color:'#cffafe' }}>
                  ASHA Helpline: 1800-180-1104 &nbsp;·&nbsp; Mon–Sat, 9 AM – 6 PM
                </p>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <a href="tel:18001801104" className="btn btn-white">📞 Call Helpline</a>
                <a href="https://nhm.gov.in" target="_blank" rel="noreferrer" className="btn btn-white">🌐 NHM Portal</a>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Detail / Eligibility Modal ── */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>

            {/* header */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${schemeColor(modal)}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.7rem', flexShrink:0 }}>
                {modal.icon || '🏛️'}
              </div>
              <div>
                <div className="modal-title">{modal.name}</div>
                {modal.shortName && <span className="modal-short">{modal.shortName} · {CATEGORY_LABEL[modal.category]}</span>}
              </div>
            </div>

            {/* tags */}
            {modal.tags?.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
                {modal.tags.map(t => (
                  <span key={t} style={{ background:`${schemeColor(modal)}12`, color:schemeColor(modal), fontSize:'.72rem', fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{t}</span>
                ))}
              </div>
            )}

            <div className="modal-section-label">About this Scheme</div>
            <div className="modal-section-text">{modal.description}</div>

            {modal.eligibilityCriteria && (
              <>
                <div className="modal-section-label">Who is Eligible?</div>
                <div className="modal-section-text">{modal.eligibilityCriteria}</div>
              </>
            )}

            {modal.benefits && (
              <>
                <div className="modal-section-label">Benefits</div>
                <div className="modal-section-text">{modal.benefits}</div>
              </>
            )}

            {/* actions */}
            <div className="modal-actions">
              {modal.applyLink && (
                <a
                  href={modal.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  🔗 Apply / Check Online (Official Portal)
                </a>
              )}
              <a href="tel:18001801104" className="btn btn-green">📞 Call ASHA Helpline</a>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ background: '#0e7490', color: 'rgba(255,255,255,.9)', textAlign: 'center', padding: '18px 24px', fontSize: '.8rem' }}>
        Shishu Aarogya &copy; 2024 &middot; {t('homeFooter_copyright_long') || 'National Child Health Portal · Government of India'}
      </footer>
    </>
  );
}
