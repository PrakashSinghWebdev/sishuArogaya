import React from 'react';
import { Link } from 'react-router-dom';
import slide1 from '../../assets/hero_mom_child.png';
import slide2 from '../../assets/hero_growth_chart.png';
import slide3 from '../../assets/hero_health_worker.png';
import { LANGUAGES, useLanguage } from '../../context/LanguageContext';

const IMPACT_STATS_DATA = [
  { value: '2.4M+', labelKey: 'aboutStat1Label', icon: '👶' },
  { value: '89K+',  labelKey: 'aboutStat2Label', icon: '👩‍⚕️' },
  { value: '680+',  labelKey: 'aboutStat3Label', icon: '🗺️' },
  { value: '22',    labelKey: 'aboutStat4Label', icon: '🌐' },
];

const PARTNERS = [
  { name: 'Ministry of Health & Family Welfare', short: 'MoHFW' },
  { name: 'National Health Mission',              short: 'NHM' },
  { name: 'UNICEF India',                         short: 'UNICEF' },
  { name: 'WHO South-East Asia',                  short: 'WHO' },
  { name: 'ICDS — Anganwadi Network',             short: 'ICDS' },
  { name: 'Ayushman Bharat Digital Mission',      short: 'ABDM' },
];

const Home = () => {
  const { language, setLanguage, t } = useLanguage();

  const TECH_FEATURES = [
    { icon: '📊', title: t('aboutFeature1'), desc: t('homeFeature1_desc_long') || 'LMS z-score method for weight-for-age, height-for-age, and weight-for-height with automated malnutrition flagging.' },
    { icon: '💉', title: t('aboutFeature2'), desc: t('homeFeature2_desc_long') || 'Complete India National Immunization Schedule auto-generated on child registration, with overdue alerts.' },
    { icon: '📍', title: t('aboutFeature3'), desc: t('homeFeature3_desc_long') || 'Live location tracking for ASHA workers in the field — accurate to ±5 m with watchPosition API.' },
    { icon: '🤖', title: t('aboutFeature4'), desc: t('homeFeature4_desc_long') || 'Gemini-powered chatbot with 22-language support and offline NLP fallback for rural low-connectivity areas.' },
    { icon: '📋', title: t('aboutFeature5'), desc: t('homeFeature5_desc_long') || 'One-click district health summaries and child health records downloadable by admins and parents.' },
    { icon: '🔔', title: t('aboutFeature6'), desc: t('homeFeature6_desc_long') || 'Automated vaccine reminders, malnutrition alerts, and visit follow-ups delivered to parents and ASHA workers.' },
  ];

  return (
    <>
      <div className="home-shell">
        {/* Navigation */}
        <nav className="home-nav shadow-sm sticky-top px-4 py-3">
          <div className="container-fluid d-flex align-items-center justify-content-between">
            <Link className="d-flex align-items-center text-decoration-none" to="/">
              <div className="home-nav-mark me-3">🏥</div>
              <div>
                <div className="home-nav-brand-title">Shishu Aarogya</div>
                <div className="home-nav-brand-subtitle">National Child Health Portal</div>
              </div>
            </Link>
            
            <div className="d-flex gap-3 align-items-center">
              <div className="d-none d-md-flex align-items-center gap-4 me-2">
                <a className="home-nav-link" href="#features">{t('homeNav_features')}</a>
                <a className="home-nav-link" href="#about">{t('homeNav_about')}</a>
                <a className="home-nav-link" href="#contact">{t('homeNav_contact')}</a>
              </div>
              {/* Language switcher */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  border: '1px solid #c5e8ef', background: '#f0fdff', color: '#0e7490',
                  borderRadius: 10, height: 38, padding: '0 10px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', maxWidth: 130,
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                ))}
              </select>
              <Link to="/login" className="home-btn-outline">{t('login')}</Link>
              <Link to="/register" className="home-btn-primary">{t('register')}</Link>
            </div>
          </div>
        </nav>

        {/* Hero Carousel */}
        <div id="homeCarousel" className="carousel slide carousel-fade home-hero-section" data-bs-ride="carousel" data-bs-interval="4000">
          <div className="carousel-indicators mb-4 pb-2">
            <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
            <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
            <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
          </div>
          <div className="carousel-inner h-100">
            <div className="carousel-item active h-100">
              <div className="home-slide-img" style={{ backgroundImage: `url(${slide1})` }}></div>
              <div className="home-overlay"></div>
              <div className="carousel-caption d-none d-md-block home-caption-card">
                <div className="home-badge mb-4">
                  <span className="home-badge-dot"></span>
                  {t('homeHero1_badge')}
                </div>
                <h1 className="home-caption-headline">{t('homeHero1_headline')}</h1>
                <p className="home-caption-desc text-white mb-0 mt-3">{t('homeHero1_desc')}</p>
              </div>
            </div>
            <div className="carousel-item h-100">
              <div className="home-slide-img" style={{ backgroundImage: `url(${slide2})` }}></div>
              <div className="home-overlay"></div>
              <div className="carousel-caption d-none d-md-block home-caption-card">
                <div className="home-badge mb-4">
                  <span className="home-badge-dot"></span>
                  {t('homeHero2_badge')}
                </div>
                <h1 className="home-caption-headline">{t('homeHero2_headline')}</h1>
                <p className="home-caption-desc text-white mb-0 mt-3">{t('homeHero2_desc')}</p>
              </div>
            </div>
            <div className="carousel-item h-100">
              <div className="home-slide-img" style={{ backgroundImage: `url(${slide3})` }}></div>
              <div className="home-overlay"></div>
              <div className="carousel-caption d-none d-md-block home-caption-card">
                <div className="home-badge mb-4">
                  <span className="home-badge-dot"></span>
                  {t('homeHero3_badge')}
                </div>
                <h1 className="home-caption-headline">{t('homeHero3_headline')}</h1>
                <p className="home-caption-desc text-white mb-0 mt-3">{t('homeHero3_desc')}</p>
              </div>
            </div>
          </div>
          <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>

        {/* Features Section */}
        <div id="features" className="container py-5 my-5">
          <div className="text-center mb-5 pb-3">
            <h2 className="home-section-title">{t('homeServices_title')}</h2>
            <p className="home-section-subtitle">{t('homeServices_subtitle')}</p>
          </div>
          <div className="row g-4">
            {[
              { icon: "bi-graph-up-arrow", title: t('homeFeature1_title'), text: t('homeFeature1_text') },
              { icon: "bi-calendar-heart", title: t('homeFeature2_title'), text: t('homeFeature2_text') },
              { icon: "bi-robot",          title: t('homeFeature3_title'), text: t('homeFeature3_text') },
              { icon: "bi-clipboard-data", title: t('homeFeature4_title'), text: t('homeFeature4_text') },
            ].map((feature, idx) => (
              <div className="col-md-6 col-lg-3" key={idx}>
                <div className="home-feature-card h-100 card shadow-sm border-0 p-4">
                  <div className="card-body text-center p-0">
                    <div className="home-feature-icon-wrapper mb-4">
                      <i className={`bi ${feature.icon} fs-2`}></i>
                    </div>
                    <h5 className="card-title fw-bold home-text-navy mb-3" style={{ fontSize: '1.1rem' }}>{feature.title}</h5>
                    <p className="card-text home-text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{feature.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Stats Bar */}
        <div style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', padding: '40px 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
              {IMPACT_STATS_DATA.map((s) => (
                <div key={s.labelKey}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 6, fontWeight: 500 }}>{t(s.labelKey)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div id="about" className="container py-5 my-4">
          <div className="row align-items-center g-5 mb-5">
            <div className="col-lg-6">
              <div className="position-relative">
                <img src="/indian_vaccination_1.png" alt="ASHA worker checking a child" className="img-fluid rounded-4 shadow-lg" style={{ objectFit: 'cover', width: '100%', height: '420px' }} />
                <div className="position-absolute bottom-0 end-0 bg-white p-3 shadow-sm" style={{ borderRadius: '16px 0 16px 0', transform: 'translate(8%, 8%)' }}>
                  <img src="/indian_vaccination_2.png" alt="Child health check" className="img-fluid rounded-3 border border-4 border-white shadow" style={{ objectFit: 'cover', width: '210px', height: '170px' }} />
                </div>
                {/* Live badge */}
                <div style={{
                  position: 'absolute', top: 20, left: 20,
                  background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#059669',
                  borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 7, height: 7, background: '#059669', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  {t('homeLiveBadge')}
                </div>
              </div>
            </div>
            <div className="col-lg-6 ps-lg-5 mt-5 mt-lg-0">
              <div className="home-badge mb-3">
                <span className="home-badge-dot"></span>
                {t('homeAbout_badge')}
              </div>
              <h2 className="home-section-title mb-4">{t('homeAbout_headline')}</h2>
              <p className="home-text-muted fs-6 mb-4" style={{ lineHeight: '1.9' }}>
                {t('homeAbout_desc')}
              </p>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-4">
                {[
                  [t('homeAbout_feat1_title'), t('homeAbout_feat1_desc')],
                  [t('homeAbout_feat2_title'), t('homeAbout_feat2_desc')],
                  [t('homeAbout_feat3_title'), t('homeAbout_feat3_desc')],
                  [t('homeAbout_feat4_title'), t('homeAbout_feat4_desc')],
                ].map(([title, desc]) => (
                  <li key={title} className="d-flex align-items-start">
                    <i className="bi bi-check-circle-fill fs-5 text-success me-3 mt-1 flex-shrink-0"></i>
                    <div>
                      <strong className="home-text-navy d-block">{title}</strong>
                      <span className="home-text-muted small">{desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/about" className="home-btn-primary" style={{ textDecoration: 'none' }}>{t('homeAbout_cta1')} &#8594;</Link>
                <Link to="/register" className="home-btn-outline" style={{ textDecoration: 'none' }}>{t('homeAbout_cta2')}</Link>
              </div>
            </div>
          </div>

          {/* Technology features grid */}
          <div className="mt-5 pt-3">
            <div className="text-center mb-5">
              <h2 className="home-section-title">{t('homePlatform_title')}</h2>
              <p className="home-section-subtitle">{t('homePlatform_subtitle')}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
              {TECH_FEATURES.map((f) => (
                <div key={f.title} style={{
                  background: '#fff', border: '1.5px solid #c5e8ef', borderRadius: 18,
                  padding: '24px 22px', transition: 'transform .25s, box-shadow .25s',
                  boxShadow: '0 4px 14px rgba(8,145,178,.06)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(8,145,178,.13)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(8,145,178,.06)'; }}>
                  <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, color: '#0c2340', fontSize: 15, marginBottom: 8 }}>{f.title}</div>
                  <div style={{ color: '#4a7a8a', fontSize: 13, lineHeight: 1.7 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Partners / backed-by */}
          <div className="mt-5 pt-4 pb-2">
            <div className="text-center mb-4">
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a7a8a' }}>{t('homePartners_label')}</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              {PARTNERS.map((p) => (
                <div key={p.short} style={{
                  background: '#f0fdff', border: '1px solid #c5e8ef', borderRadius: 12,
                  padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#0e7490',
                }}>
                  {p.short} <span style={{ color: '#94a3b8', fontWeight: 400 }}>· {p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="home-cta-section py-5 my-5">
          <div className="container text-center py-5 position-relative z-1">
            <h2 className="home-section-title text-white mb-3">{t('homeCTA_title')}</h2>
            <p className="mb-4 fs-5 text-white-50 mx-auto" style={{ maxWidth: '600px' }}>{t('homeCTA_desc')}</p>
            <Link to="/register" className="home-btn-primary btn-lg px-5 py-3 mt-3 fw-bold shadow-lg" style={{ fontSize: '1.1rem' }}>{t('homeCTA_btn')}</Link>
          </div>
          <div className="home-cta-bg-blob"></div>
        </div>

        {/* Footer */}
        <footer id="contact" className="home-footer text-white pt-5 pb-4 mt-auto">
          <div className="container">
            <div className="row mb-5">
              <div className="col-md-5 mb-4 mb-md-0 pe-md-5">
                <h5 className="fw-bold text-white mb-4 d-flex align-items-center" style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '1.4rem' }}>
                  <div className="home-nav-mark me-3" style={{width: 38, height: 38, fontSize: 14}}>🏥</div>
                  Shishu Aarogya
                </h5>
                <p className="home-footer-text" style={{ fontSize: '0.95rem', lineHeight: '1.7' }}>
                  {t('homeFooter_desc')}
                </p>
              </div>
              <div className="col-md-3 mb-4 mb-md-0 offset-md-1">
                <h5 className="fw-bold text-white mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>{t('homeFooter_links')}</h5>
                <ul className="list-unstyled home-footer-links" style={{ lineHeight: '2.4' }}>
                  <li><a href="#features" className="text-white-50 text-decoration-none transition-color">{t('homeFooter_linkFeatures')}</a></li>
                  <li><a href="#about" className="text-white-50 text-decoration-none transition-color">{t('homeFooter_linkAbout')}</a></li>
                  <li><Link to="/login" className="text-white-50 text-decoration-none transition-color">{t('homeFooter_linkSignIn')}</Link></li>
                  <li><Link to="/register" className="text-white-50 text-decoration-none transition-color">{t('homeFooter_linkRegister')}</Link></li>
                </ul>
              </div>
              <div className="col-md-3">
                <h5 className="fw-bold text-white mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>{t('homeFooter_contact')}</h5>
                <ul className="list-unstyled home-footer-text" style={{ lineHeight: '2.4' }}>
                  <li className="d-flex"><i className="bi bi-geo-alt me-3 mt-1" style={{ color: '#06b6d4' }}></i> Health Dept, New Delhi</li>
                  <li className="d-flex"><i className="bi bi-envelope me-3 mt-1" style={{ color: '#06b6d4' }}></i> support@shishuaarogya.gov.in</li>
                  <li className="d-flex"><i className="bi bi-telephone me-3 mt-1" style={{ color: '#06b6d4' }}></i> +91 1800 123 4567</li>
                </ul>
              </div>
            </div>
            <div className="text-center pt-4 border-top border-secondary home-footer-text small">
              &copy; {new Date().getFullYear()} {t('homeFooter_copyright')}
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;700&display=swap');
        
        .home-shell {
          font-family: 'DM Sans', sans-serif;
          background: #f0fdff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Typography */
        .home-text-navy { color: #0c2340; }
        .home-text-muted { color: #4a7a8a; }
        
        .home-section-title {
          font-family: 'Libre Baskerville', serif;
          font-weight: 700;
          color: #0c2340;
          font-size: clamp(28px, 3vw, 42px);
          letter-spacing: -0.01em;
        }
        .home-section-title span { color: #0e7490; }
        
        .home-section-subtitle {
          color: #4a7a8a;
          font-size: 1.1rem;
          margin-top: 12px;
        }

        /* Navigation */
        .home-nav {
          background: #fff;
          border-bottom: 1px solid rgba(8, 145, 178, 0.15);
        }
        .home-nav-mark {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #0891b2, #0e7490);
          color: #fff; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700;
          box-shadow: 0 4px 14px rgba(8, 145, 178, 0.3);
        }
        .home-nav-brand-title {
          font-family: 'Libre Baskerville', serif;
          font-weight: 700; color: #0c2340; font-size: 20px; line-height: 1.2;
        }
        .home-nav-brand-subtitle {
          font-size: 11px; color: #4a7a8a; margin-top: 1px; letter-spacing: 0.05em;
        }
        .home-nav-link {
          color: #0c2340; text-decoration: none; font-weight: 500; font-size: 15px;
          transition: color 0.2s;
        }
        .home-nav-link:hover { color: #0891b2; }

        /* Buttons */
        .home-btn-primary {
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
          color: #fff; border: none; padding: 11px 26px; border-radius: 11px;
          font-weight: 500; text-decoration: none; transition: all 0.3s ease;
          display: inline-block; letter-spacing: 0.02em;
        }
        .home-btn-primary:hover {
          color: #fff; transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(8, 145, 178, 0.25);
        }
        .home-btn-outline {
          background: #f0fdff; color: #0e7490; border: 1px solid #c5e8ef;
          padding: 10px 24px; border-radius: 11px; font-weight: 500; text-decoration: none;
          transition: all 0.3s ease; display: inline-block;
        }
        .home-btn-outline:hover {
          background: #e0f7fa; color: #0891b2; border-color: #0891b2;
        }

        /* Badge */
        .home-badge {
          display: inline-flex; align-items: center; gap: 8px; width: fit-content;
          padding: 6px 16px; border-radius: 999px;
          background: rgba(247, 201, 72, 0.16); border: 1px solid rgba(247, 201, 72, 0.38);
          font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: #f7c948; font-family: 'DM Sans', sans-serif;
        }
        .home-badge-dot {
          width: 6px; height: 6px; background: #f7c948; border-radius: 50%;
          display: inline-block; animation: pulse 2s infinite;
        }

        /* Hero */
        .home-hero-section {
          height: 80vh;
          min-height: 600px;
          background: #0e7490;
        }
        .home-slide-img {
          position: absolute; inset: 0;
          background-size: cover; background-position: center; border-radius: 0;
        }
        .home-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(8, 145, 178, 0.88) 0%, rgba(8, 145, 178, 0.52) 55%, rgba(14, 116, 144, 0.82) 100%);
          z-index: 1;
        }
        .home-caption-card {
          position: absolute; bottom: 15%; left: 8%; right: auto; z-index: 2;
          text-align: left; max-width: 650px;
          animation: fadeInUp 0.8s ease-out;
        }
        .home-caption-headline {
          font-family: 'Libre Baskerville', serif;
          font-size: clamp(42px, 4vw, 64px);
          font-weight: 700; line-height: 1.1; letter-spacing: -0.02em;
          color: #fff; margin-bottom: 20px;
        }
        .home-caption-headline span { color: #f7c948; }
        .home-caption-desc {
          font-size: 1.15rem; line-height: 1.6; color: rgba(255, 255, 255, 0.9);
          font-weight: 300; max-width: 550px;
        }

        /* Feature Cards */
        .home-feature-card {
          border-radius: 20px;
          background: #fff;
          border: 1px solid #c5e8ef !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 12px rgba(8, 145, 178, 0.05) !important;
        }
        .home-feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 32px rgba(8, 145, 178, 0.12) !important;
        }
        .home-feature-icon-wrapper {
          width: 68px; height: 68px; margin: 0 auto;
          background: #cffafe; color: #0891b2;
          border-radius: 18px; display: flex; align-items: center; justify-content: center;
          transition: background 0.3s, color 0.3s;
        }
        .home-feature-card:hover .home-feature-icon-wrapper {
          background: linear-gradient(135deg, #0891b2, #0e7490);
          color: #fff;
        }

        /* CTA */
        .home-cta-section {
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
          position: relative; overflow: hidden;
          border-radius: 24px;
          max-width: 95%; margin: 0 auto;
        }
        .home-cta-section .home-section-title {
          color: #fff;
        }
        .home-cta-bg-blob {
          position: absolute; top: -50%; left: -10%;
          width: 500px; height: 500px; background: #06b6d4; border-radius: 50%;
          filter: blur(120px); opacity: 0.3; pointer-events: none; z-index: 0;
        }

        /* Footer */
        .home-footer {
          background: #083344;
          border-top: 5px solid #0891b2;
        }
        .home-footer-text {
          color: rgba(255, 255, 255, 0.65);
        }
        .home-footer-links a:hover {
          color: #f7c948 !important; /* Yellow hover on links */
        }
        
        .carousel-indicators { margin-bottom: 2rem; z-index: 3; }
        .carousel-indicators [data-bs-target] {
          width: 8px; height: 8px; border-radius: 50%; border: none;
          background-color: rgba(255, 255, 255, 0.4); margin: 0 6px;
          transition: all 0.3s ease;
        }
        .carousel-indicators .active {
          width: 24px; border-radius: 4px; background-color: #f7c948;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .home-caption-card { left: 5%; right: 5%; bottom: 10%; }
        }
      `}</style>
    </>
  );
};

export default Home;
