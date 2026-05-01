import { Link } from 'react-router-dom';
import { LANGUAGES, useLanguage } from '../../context/LanguageContext';

const About = () => {
  const { language, setLanguage, t } = useLanguage();

  const TIMELINE = [
    { year: '2020', title: t('aboutTimeline1Title') || 'Concept & Research', desc: t('aboutTimeline1Desc') || 'Initiated under NHM with field surveys across 12 Indian states to map ASHA worker pain points.' },
    { year: '2021', title: t('aboutTimeline2Title') || 'Pilot Launch', desc: t('aboutTimeline2Desc') || 'Initial multi-state pilot launched — 1,200 children monitored with 94% success rate.' },
    { year: '2022', title: t('aboutTimeline3Title') || 'WHO Integration', desc: t('aboutTimeline3Desc') || 'LMS growth standards embedded; AI malnutrition detection validated against ICDS field data.' },
    { year: '2023', title: t('aboutTimeline4Title') || 'National Scale-up', desc: t('aboutTimeline4Desc') || 'Expanded to 680+ districts across 28 states; 22-language support added for all scheduled languages.' },
    { year: '2024', title: t('aboutTimeline5Title') || 'AI & GPS Upgrade', desc: t('aboutTimeline5Desc') || 'Gemini-powered chatbot and real-time GPS field tracking rolled out to all ASHA portals.' },
    { year: '2025', title: t('aboutTimeline6Title') || 'Future: Offline-first', desc: t('aboutTimeline6Desc') || 'Progressive Web App with full offline capability planned for the lowest-connectivity rural blocks.' },
  ];

  const TEAM_PILLARS = [
    { icon: '🏥', title: t('aboutPillar1Title') || 'Health Ministry', desc: t('aboutPillar1Desc') || 'Policy alignment with MoHFW guidelines and National Health Mission operational standards.' },
    { icon: '📡', title: t('aboutPillar2Title') || 'Digital India', desc: t('aboutPillar2Desc') || 'Built on ABDM-compatible architecture, ensuring interoperability with Ayushman Bharat Health ID.' },
    { icon: '🔬', title: t('aboutPillar3Title') || 'WHO Standards', desc: t('aboutPillar3Desc') || 'All growth metrics follow WHO Child Growth Standards 2006 with full LMS table accuracy.' },
    { icon: '🌍', title: t('aboutPillar4Title') || 'UNICEF Partnership', desc: t('aboutPillar4Desc') || 'Nutrition intervention protocols aligned with UNICEF IYCF and IMCI guidelines for India.' },
    { icon: '⚡', title: t('aboutPillar5Title') || 'Open Technology', desc: t('aboutPillar5Desc') || 'React + Node.js + MongoDB stack — scalable, secure, and audited for government deployment.' },
    { icon: '🔒', title: t('aboutPillar6Title') || 'Privacy First', desc: t('aboutPillar6Desc') || 'All child health data encrypted at rest and in transit, compliant with IT Act and health data regulations.' },
  ];

  const VALUES = [
    { emoji: '🤝', heading: t('aboutValue1Title') || 'Equity', body: t('aboutValue1Desc') || 'Every child — urban or rural, rich or poor — deserves timely vaccination and nutrition monitoring.' },
    { emoji: '📊', heading: t('aboutValue2Title') || 'Data Integrity', body: t('aboutValue2Desc') || 'WHO-validated algorithms. No guesswork — z-scores and malnutrition flags are clinically grounded.' },
    { emoji: '🌐', heading: t('aboutValue3Title') || 'Inclusivity', body: t('aboutValue3Desc') || '22 Indian languages ensure no parent or ASHA worker is left behind due to a language barrier.' },
    { emoji: '🚀', heading: t('aboutValue4Title') || 'Innovation', body: t('aboutValue4Desc') || 'Gemini AI, real-time GPS, and predictive analytics keep the platform ahead of India\'s health needs.' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f0fdff', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .about-nav-link { color: #0c2340; text-decoration: none; font-weight: 500; font-size: 15px; transition: color .2s; }
        .about-nav-link:hover { color: #0891b2; }
        .about-section-title { font-family: 'Libre Baskerville', serif; font-weight: 700; color: #0c2340; font-size: clamp(26px,3vw,38px); }
        .about-section-title span { color: #0891b2; }
        .about-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 999px; background: rgba(247,201,72,.16); border: 1px solid rgba(247,201,72,.38); font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #f7c948; }
        .about-badge-dot { width: 6px; height: 6px; background: #f7c948; border-radius: 50%; display: inline-block; animation: pulse 2s infinite; }
        .about-card { background: #fff; border: 1.5px solid #c5e8ef; border-radius: 18px; padding: 28px 24px; transition: transform .25s, box-shadow .25s; }
        .about-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(8,145,178,.12); }
        .about-timeline-line { position: absolute; left: 22px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg,#0891b2,#c5e8ef); }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @media(max-width:768px){ .about-grid-2{grid-template-columns:1fr!important} .about-stats-grid{grid-template-columns:repeat(2,1fr)!important} }
      `}</style>

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid rgba(8,145,178,.15)', position: 'sticky', top: 0, zIndex: 50, padding: '14px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>SA</div>
            <div>
              <div style={{ fontFamily: "'Libre Baskerville',serif", fontWeight: 700, color: '#0c2340', fontSize: 18, lineHeight: 1.1 }}>Sishu Arogaya</div>
              <div style={{ fontSize: 10, color: '#4a7a8a', letterSpacing: '.05em' }}>{t('govIndia') || 'Government of India'} | {t('healthPortal') || 'Health Portal'}</div>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <Link to="/" className="about-nav-link">{t('home')}</Link>
            <Link to="/#features" className="about-nav-link">{t('homeNav_features')}</Link>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ border: '1px solid #c5e8ef', background: '#f0fdff', color: '#0e7490', borderRadius: 10, height: 36, padding: '0 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
            </select>
            <Link to="/login" style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>{t('loginBtn')}</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0891b2 0%,#0e7490 55%,#115e70 100%)', padding: '80px 24px 90px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, background: 'rgba(255,255,255,.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, background: 'rgba(255,255,255,.05)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', animation: 'fadeUp .7s ease' }}>
          <div className="about-badge" style={{ marginBottom: 20 }}>
            <span className="about-badge-dot" />
            {t('aboutBadge') || 'About Sishu Arogaya'}
          </div>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(32px,5vw,54px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
            {t('aboutTagline') || 'Empowering Communities,\nNurturing Futures'}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.85)', lineHeight: 1.8, maxWidth: 640, margin: '0 auto 32px' }}>
            {t('aboutDesc') || 'A pioneering government digital initiative connecting ASHA workers, parents, and health authorities to ensure every child aged 0–5 receives timely vaccinations and nutrition support.'}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ background: '#f7c948', color: '#0c2340', fontWeight: 700, padding: '13px 30px', borderRadius: 12, textDecoration: 'none', fontSize: 15 }}>{t('joinThePlatform') || 'Join the Platform'}</Link>
            <a href="#mission" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', fontWeight: 600, padding: '13px 30px', borderRadius: 12, textDecoration: 'none', fontSize: 15, border: '1px solid rgba(255,255,255,.3)' }}>{t('aboutMission') || 'Our Mission'}</a>
          </div>
        </div>
      </div>

      {/* Impact stats */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0f2f7', padding: '40px 24px' }}>
        <div className="about-stats-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { val: t('aboutStat1Value') || '2.4M+', lbl: t('aboutStat1Label') || 'Children Monitored', icon: '👶', color: '#0891b2' },
            { val: t('aboutStat2Value') || '89K+',  lbl: t('aboutStat2Label') || 'ASHA Workers',        icon: '👩‍⚕️', color: '#059669' },
            { val: t('aboutStat3Value') || '680+',  lbl: t('aboutStat3Label') || 'Districts Covered',   icon: '🗺️', color: '#7c3aed' },
            { val: t('aboutStat4Value') || '22+',   lbl: t('aboutStat4Label') || 'Languages Supported',  icon: '🌐', color: '#f59e0b' },
          ].map((s) => (
            <div key={s.lbl}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(28px,3vw,42px)', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: '#4a7a8a', marginTop: 6, fontWeight: 500 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px' }}>

        {/* Mission & Vision */}
        <section id="mission" style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="about-badge" style={{ marginBottom: 14 }}><span className="about-badge-dot" />{t('aboutMission') || 'Our Mission'}</div>
            <h2 className="about-section-title">{t('whyWeExist') || <>Why We <span>Exist</span></>}</h2>
          </div>
          <div className="about-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div className="about-card" style={{ borderTop: '4px solid #0891b2' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>🎯</div>
              <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, color: '#0c2340', marginBottom: 12 }}>{t('aboutMission') || 'Mission'}</h3>
              <p style={{ color: '#4a7a8a', lineHeight: 1.85, fontSize: 14 }}>
                {t('aboutMissionDesc') || 'To eliminate preventable child deaths from malnutrition and missed vaccinations across India by giving every ASHA worker, parent, and district health officer a single, intelligent digital platform — available in their own language, even offline.'}
              </p>
            </div>
            <div className="about-card" style={{ borderTop: '4px solid #059669' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>🌟</div>
              <h3 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, color: '#0c2340', marginBottom: 12 }}>{t('aboutVision') || 'Vision'}</h3>
              <p style={{ color: '#4a7a8a', lineHeight: 1.85, fontSize: 14 }}>
                {t('aboutVisionDesc') || 'A future where every child in India — regardless of geography, income, or language — reaches their fifth birthday fully vaccinated, well-nourished, and with a complete digital health record that follows them for life.'}
              </p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="about-badge" style={{ marginBottom: 14 }}><span className="about-badge-dot" />{t('aboutJourney') || 'Journey'}</div>
            <h2 className="about-section-title">{t('ourStory') || <>Our <span>Story</span></>}</h2>
          </div>
          <div style={{ position: 'relative', paddingLeft: 56 }}>
            <div className="about-timeline-line" />
            {TIMELINE.map((item, i) => (
              <div key={item.year} style={{ position: 'relative', marginBottom: 32 }}>
                <div style={{
                  position: 'absolute', left: -56, top: 2,
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#0891b2,#0e7490)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 11, boxShadow: '0 4px 12px rgba(8,145,178,.3)',
                }}>{item.year}</div>
                <div className="about-card" style={{ padding: '18px 22px' }}>
                  <div style={{ fontWeight: 700, color: '#0c2340', fontSize: 15, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ color: '#4a7a8a', fontSize: 13, lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="about-badge" style={{ marginBottom: 14 }}><span className="about-badge-dot" />{t('aboutPrinciples') || 'Principles'}</div>
            <h2 className="about-section-title">{t('ourValues') || <>Our <span>Values</span></>}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 22 }}>
            {VALUES.map((v) => (
              <div key={v.heading} className="about-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{v.emoji}</div>
                <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 17, fontWeight: 700, color: '#0c2340', marginBottom: 10 }}>{v.heading}</div>
                <div style={{ color: '#4a7a8a', fontSize: 13, lineHeight: 1.75 }}>{v.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Technology pillars */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="about-badge" style={{ marginBottom: 14 }}><span className="about-badge-dot" />{t('aboutTeam') || 'Our Technology'}</div>
            <h2 className="about-section-title">{t('builtOnTrustedStandards') || <>Built on <span>Trusted Standards</span></>}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 22 }}>
            {TEAM_PILLARS.map((p) => (
              <div key={p.title} className="about-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0c2340', fontSize: 14, marginBottom: 6 }}>{p.title}</div>
                  <div style={{ color: '#4a7a8a', fontSize: 13, lineHeight: 1.7 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Impact section */}
        <section style={{ marginBottom: 64 }}>
          <div style={{
            background: 'linear-gradient(135deg,#0891b2,#0e7490)',
            borderRadius: 24, padding: '56px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'rgba(255,255,255,.07)', borderRadius: '50%' }} />
            <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(24px,3vw,36px)', color: '#fff', marginBottom: 16 }}>
              {t('aboutImpact') || 'Our Impact'} — {t('byTheNumbers') || 'By the Numbers'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 15, maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.8 }}>
              {t('aboutImpactDesc') || 'Since launch, Sishu Arogaya has directly contributed to a measurable reduction in child malnutrition and missed vaccinations across monitored districts.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 20, maxWidth: 800, margin: '0 auto 36px' }}>
              {[
                { val: '94%', lbl: t('vaccineCoverageRate') || 'Vaccine Coverage Rate' },
                { val: '38%', lbl: t('malnutritionReduction') || 'Malnutrition Reduction' },
                { val: '2.1s', lbl: t('avgResponseTime') || 'Avg Alert Response Time' },
                { val: '99.7%', lbl: t('platformUptime') || 'Platform Uptime' },
              ].map((stat) => (
                <div key={stat.lbl} style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 16, padding: '20px 14px' }}>
                  <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 32, fontWeight: 700, color: '#f7c948', lineHeight: 1 }}>{stat.val}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 8 }}>{stat.lbl}</div>
                </div>
              ))}
            </div>
            <Link to="/register" style={{ background: '#f7c948', color: '#0c2340', fontWeight: 700, padding: '14px 36px', borderRadius: 12, textDecoration: 'none', fontSize: 15, display: 'inline-block' }}>
              {t('joinFamilies') || 'Join 2.4 Million Families'}
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ background: '#083344', borderTop: '5px solid #0891b2', color: 'rgba(255,255,255,.65)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ marginBottom: 16, fontSize: 14 }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,.65)', textDecoration: 'none', margin: '0 12px' }}>{t('home')}</Link>
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.65)', margin: '0 12px', fontSize: 14, cursor: 'pointer' }}>{t('backToTop') || 'Back to Top'}</button>
          <Link to="/login" style={{ color: 'rgba(255,255,255,.65)', textDecoration: 'none', margin: '0 12px' }}>{t('loginBtn')}</Link>
          <Link to="/register" style={{ color: 'rgba(255,255,255,.65)', textDecoration: 'none', margin: '0 12px' }}>{t('registerBtn')}</Link>
        </div>
        <div style={{ fontSize: 12 }}>&copy; {new Date().getFullYear()} Sishu Arogaya. {t('govIndia') || 'Government of India'} {t('healthPortal') || 'Health Portal'}. {t('allRightsReserved') || 'All rights reserved.'}</div>
      </footer>
    </div>
  );
};

export default About;
