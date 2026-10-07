import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import usePublicStats from '../../hooks/usePublicStats';

const featureKeys = [
  'aboutFeature1',
  'aboutFeature2',
  'aboutFeature3',
  'aboutFeature4',
  'aboutFeature5',
  'aboutFeature6',
];

function About() {
  const { t } = useLanguage();
  const live = usePublicStats();
  const stats = [
    { value: live.children,    labelKey: 'aboutStat1Label' },
    { value: live.ashaWorkers, labelKey: 'aboutStat2Label' },
    { value: live.districts,   labelKey: 'aboutStat3Label' },
    { value: live.languages,   labelKey: 'aboutStat4Label' },
  ];

  return (
    <div className="about-page">
      <section className="about-hero-section">
        <div className="about-container">
          <div
            className="about-badge"
          >
            Shishu Aarogya
          </div>

          <div className="about-hero-grid">
            <div>
              <h1 className="about-title">{t('aboutTitle')}</h1>
              <p className="about-tagline">
                {t('aboutTagline')}
              </p>
              <p className="about-description">
                {t('aboutDesc')}
              </p>

              <div className="about-actions">
                <Link
                  to="/register"
                  className="about-btn about-btn-primary"
                >
                  {t('register')}
                </Link>
                <Link
                  to="/"
                  className="about-btn about-btn-secondary"
                >
                  Back Home
                </Link>
              </div>
            </div>

            <div className="about-stats-panel">
              <p className="about-panel-label">
                {t('aboutPilotTitle')}
              </p>
              <p className="about-panel-copy">
                {t('aboutPilotDesc')}
              </p>
              <div className="about-stats-grid">
                {stats.map((item) => (
                  <div key={item.labelKey} className="about-stat-card">
                    <div className="about-stat-value">{item.value}</div>
                    <div className="about-stat-label">{t(item.labelKey)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-content-section">
        <div className="about-container">
          <div className="about-card-grid">
            <article className="about-surface-card">
              <h2 className="about-section-heading">{t('aboutMission')}</h2>
              <p className="about-copy">
                {t('aboutDesc')}
              </p>
            </article>

            <article className="about-surface-card">
              <h2 className="about-section-heading">{t('aboutVision')}</h2>
              <p className="about-copy">
                {t('homeAbout_headline')}
              </p>
            </article>
          </div>

          <div className="about-surface-card about-features-card">
            <h2 className="about-section-heading">{t('aboutTeam')}</h2>
            <div className="about-feature-grid">
              {featureKeys.map((key) => (
                <div key={key} className="about-feature-card">
                  {t(key)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .about-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(247,201,72,0.18), transparent 26%),
            linear-gradient(180deg, #f0fdff 0%, #ffffff 100%);
          color: #0c2340;
          font-family: 'DM Sans', sans-serif;
        }

        .about-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .about-hero-section {
          padding: 72px 20px 40px;
        }

        .about-content-section {
          padding: 12px 20px 72px;
        }

        .about-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 16px;
          background: rgba(14,116,144,0.09);
          border: 1px solid rgba(14,116,144,0.16);
          color: #0e7490;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .about-hero-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 28px;
          align-items: center;
        }

        .about-title {
          margin: 0;
          font-family: 'Libre Baskerville', serif;
          font-size: clamp(34px, 5vw, 56px);
          line-height: 1.1;
        }

        .about-tagline {
          margin: 18px 0 10px;
          font-size: 20px;
          color: #0e7490;
          font-weight: 700;
        }

        .about-description,
        .about-copy {
          margin: 0;
          color: #4a7a8a;
          font-size: 16px;
          line-height: 1.8;
        }

        .about-description {
          max-width: 640px;
        }

        .about-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .about-btn {
          text-decoration: none;
          padding: 12px 22px;
          border-radius: 12px;
          font-weight: 700;
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .about-btn:hover {
          transform: translateY(-1px);
        }

        .about-btn-primary {
          background: linear-gradient(135deg, #0891b2, #0e7490);
          color: #fff;
          box-shadow: 0 12px 24px rgba(8,145,178,0.18);
        }

        .about-btn-secondary {
          border: 1px solid #c5e8ef;
          background: #fff;
          color: #0e7490;
        }

        .about-stats-panel {
          background: linear-gradient(160deg, #083344 0%, #0e7490 100%);
          border-radius: 28px;
          padding: 28px;
          color: #fff;
          box-shadow: 0 20px 60px rgba(8,145,178,0.18);
        }

        .about-panel-label {
          margin: 0;
          opacity: 0.8;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .about-panel-copy {
          margin: 12px 0 0;
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255,255,255,0.86);
        }

        .about-stats-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .about-stat-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          padding: 18px 16px;
        }

        .about-stat-value {
          font-size: 28px;
          font-weight: 700;
        }

        .about-stat-label {
          margin-top: 6px;
          font-size: 13px;
          color: rgba(255,255,255,0.72);
        }

        .about-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .about-surface-card {
          background: #fff;
          border: 1px solid #d9f4f8;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 12px 32px rgba(8,145,178,0.07);
        }

        .about-features-card {
          margin-top: 24px;
          padding: 28px;
        }

        .about-section-heading {
          margin-top: 0;
          font-family: 'Libre Baskerville', serif;
          font-size: 28px;
        }

        .about-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .about-feature-card {
          border-radius: 18px;
          padding: 18px 16px;
          background: #f8fdff;
          border: 1px solid #d9f4f8;
          color: #28576b;
          line-height: 1.7;
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .about-hero-section {
            padding-top: 56px;
          }

          .about-hero-grid {
            gap: 24px;
          }

          .about-title {
            font-size: clamp(30px, 5vw, 46px);
          }
        }

        @media (max-width: 768px) {
          .about-hero-section,
          .about-content-section {
            padding-left: 16px;
            padding-right: 16px;
          }

          .about-hero-grid {
            grid-template-columns: 1fr;
          }

          .about-title {
            font-size: 32px;
          }

          .about-tagline {
            font-size: 18px;
          }

          .about-stats-panel,
          .about-surface-card,
          .about-features-card {
            border-radius: 22px;
            padding: 22px;
          }
        }

        @media (max-width: 560px) {
          .about-hero-section {
            padding-top: 40px;
            padding-bottom: 28px;
          }

          .about-content-section {
            padding-top: 6px;
            padding-bottom: 44px;
          }

          .about-badge {
            font-size: 11px;
            padding: 7px 13px;
          }

          .about-title {
            font-size: 28px;
          }

          .about-description,
          .about-copy,
          .about-panel-copy {
            font-size: 15px;
            line-height: 1.7;
          }

          .about-actions {
            flex-direction: column;
          }

          .about-btn {
            width: 100%;
          }

          .about-stats-grid,
          .about-card-grid,
          .about-feature-grid {
            grid-template-columns: 1fr;
          }

          .about-section-heading {
            font-size: 24px;
          }

          .about-stat-value {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}

export default About;
