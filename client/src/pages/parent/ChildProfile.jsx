import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MediaCarousel, { MEDIA_ARRAY } from '../../components/MediaCarousel';
import { childAPI, reportAPI, vaccinationAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import useSelectedChild from '../../hooks/useSelectedChild';
import ParentNavbar from '../../components/ParentNavbar';
import GrowthMonitoring from './GrowthMonitoring';
import { DIET_PLANS, getAgeGroup } from './DietPlan';
import { currentMealIndex, mealItemsText } from '../../utils/mealTime';

const VACCINE_BADGE = {
  missed:   { bg: '#fee2e2', color: '#b91c1c', label: 'Missed' },
  due:      { bg: '#fef3c7', color: '#92400e', label: 'Due' },
  upcoming: { bg: '#f1f5f9', color: '#475569', label: 'Upcoming' },
};

function SideCardHeader({ title, linkTo, linkText }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
      <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: themeColors.teal2, margin: 0 }}>{title}</h5>
      <Link to={linkTo} style={{ fontSize: 12, fontWeight: 600, color: themeColors.teal, textDecoration: 'none' }}>{linkText} →</Link>
    </div>
  );
}

const themeColors = {
  teal: '#0891b2', teal2: '#0e7490', teal3: '#cffafe', teal4: '#f0fdff',
  bg: '#f8fffe', text: '#0c2340', muted: '#4a7a8a', border: '#c5e8ef',
};



function fmt(date) {
  const v = new Date(date);
  return Number.isNaN(v.getTime()) ? 'N/A' : v.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcAge(dob) {
  if (!dob) return '';
  const now = new Date();
  const d = new Date(dob);
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years ${months % 12}m`;
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: themeColors.teal4, borderRadius: 10, marginBottom: 8 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: themeColors.teal3, display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: themeColors.muted, fontWeight: 600, marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: themeColors.text }}>{value || '—'}</div>
      </div>
    </div>
  );
}

export default function ChildProfile() {
  const { t } = useLanguage();
  const { children, selectedChild, selectedChildId, setSelectedChild, setChildren, loading } = useSelectedChild();
  const [showForm, setShowForm] = useState(false);
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [slide, setSlide] = useState(0);
  const [form, setForm] = useState({
    name: '', dob: '', gender: 'male', bloodGroup: 'Unknown', birthWeight: '', birthHeight: '', motherName: '', fatherName: '', contactPhone: '',
  });

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % MEDIA_ARRAY.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await childAPI.add(form);
      const refreshed = await childAPI.list();
      setChildren(refreshed.data);
      if (data?.child?._id) {
        setSelectedChild(data.child);
      } else if (refreshed.data[0]?._id) {
        setSelectedChild(refreshed.data[0]._id);
      }
      setShowForm(false);
      setForm({ name: '', dob: '', gender: 'male', bloodGroup: 'Unknown', birthWeight: '', birthHeight: '', motherName: '', fatherName: '', contactPhone: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add child.');
    } finally {
      setSubmitting(false);
    }
  };

  // Recording growth updates the child's current weight/height/status on the server
  const refreshSelectedChild = async () => {
    const { data } = await childAPI.get(selectedChild._id);
    setChildren((prev) => prev.map((c) => (c._id === data._id ? data : c)));
    setSelectedChild(data);
  };

  const [vaccines, setVaccines] = useState([]);
  useEffect(() => {
    setVaccines([]);
    if (!selectedChild?._id) return;
    vaccinationAPI.getSchedule(selectedChild._id).then((res) => setVaccines(res.data || [])).catch(() => {});
  }, [selectedChild?._id]);
  const vaccinesDone = vaccines.filter((v) => v.status === 'done').length;
  const nextVaccines = vaccines.filter((v) => v.status !== 'done')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 4);

  const ageMonths = selectedChild
    ? selectedChild.ageInMonths ?? Math.floor((Date.now() - new Date(selectedChild.dob)) / (1000 * 60 * 60 * 24 * 30.44))
    : null;
  const dietPlan = DIET_PLANS[getAgeGroup(ageMonths)?.tag];
  const meals = dietPlan?.meals || [];
  const nowMeal = currentMealIndex(meals);
  // Current meal + the one after it (wrapping to tomorrow's first); "every 2–3 hours" plans have one entry
  const feedNow = nowMeal === -1 ? meals.slice(0, 1) : [meals[nowMeal], meals[(nowMeal + 1) % meals.length]].filter((m, i, a) => a.indexOf(m) === i);

  const [dlLoading, setDlLoading] = useState(false);

  const handleDownload = async () => {
    if (!selectedChild) return;
    setDlLoading(true);
    try {
      const res = await reportAPI.childPDF(selectedChild._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedChild.name}-health-report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { alert('Failed to download report.'); }
    finally { setDlLoading(false); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: themeColors.bg, minHeight: '100vh', color: themeColors.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        .cp-card{background:#fff;border:1.5px solid ${themeColors.border};border-radius:16px;box-shadow:0 2px 12px rgba(8,145,178,.07);padding:24px;margin-bottom:20px}
        .cp-btn{padding:9px 18px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;border:none;transition:all .2s}
        .cp-btn-teal{background:${themeColors.teal};color:#fff} .cp-btn-teal:hover{background:${themeColors.teal2}}
        .cp-btn-out{background:#fff;color:${themeColors.teal};border:1.5px solid ${themeColors.border}} .cp-btn-out:hover{background:${themeColors.teal4}}
        .meal-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(8,145,178,.13)!important}
        @media(max-width:900px){.cp-grid2{grid-template-columns:1fr!important}.cp-grid4{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:600px){.cp-grid4{grid-template-columns:1fr!important}.cp-nav-links{display:none!important}}
      `}</style>

      {/* Navbar */}
      <ParentNavbar />

      {/* Hero */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        <MediaCarousel currentSlideIndex={slide} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${themeColors.teal2}ee,${themeColors.teal}bb)` }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 14 }}>🏥 {t('myChild')}</div>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
            {t('childInfoTitle')} <span style={{ color: themeColors.teal3 }}>{t('viewProfile')}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, marginTop: 8, textAlign: 'center' }}>{t('growth')}, {t('vaccines')}, {t('nutrition')} &amp; ASHA support</p>
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 3 }}>
          {MEDIA_ARRAY.map((_, i) => <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 7, height: 7, borderRadius: 4, background: i === slide ? '#fff' : 'rgba(255,255,255,.45)', cursor: 'pointer', transition: 'all .3s' }} />)}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
<h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 24, fontWeight: 700, color: themeColors.text, margin: 0 }}>{t('myChild')}</h2>
          <div style={{ display: 'flex', gap: 10 }}>
              <button className="cp-btn cp-btn-out" onClick={() => setShowForm(true)} style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fed7aa' }}>
              ➕ {t('addChild')}
            </button>
            {selectedChild && (
              <button className="cp-btn cp-btn-teal" onClick={() => setShowGrowthForm(true)}>
                📏 Record Growth
              </button>
            )}
            {selectedChild && (
              <button className="cp-btn cp-btn-out" onClick={handleDownload} disabled={dlLoading}>
                {dlLoading ? `${t('loading')}...` : `⬇️ ${t('downloadReport')}`}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid #c5e8ef', borderTopColor: '#0891b2', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Add Child Form */}
            {showForm && (
              <div className="cp-card" style={{ animation: 'fadeUp .4s ease', marginBottom: 24 }}>
                <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 17, fontWeight: 700, color: themeColors.teal2, marginBottom: 16 }}>➕ Register New Child</h5>
                {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
                    {[
                      { label: 'Child Name', field: 'name', type: 'text', placeholder: 'Full name', required: true },
                      { label: 'Date of Birth', field: 'dob', type: 'date', required: true },
                      { label: 'Birth Weight (kg)', field: 'birthWeight', type: 'number', placeholder: '3.2', step: '0.1' },
                      { label: 'Birth Height (cm)', field: 'birthHeight', type: 'number', placeholder: '50', step: '0.1' },
                      { label: "Mother's Name", field: 'motherName', type: 'text', placeholder: "Mother's full name" },
                      { label: "Father's Name", field: 'fatherName', type: 'text', placeholder: "Father's full name" },
                      { label: 'Contact Phone', field: 'contactPhone', type: 'tel', placeholder: '10-digit mobile' },
                    ].map(({ label, field, type, placeholder, required, step }) => (
                      <div key={field}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.muted, display: 'block', marginBottom: 5 }}>{label}</label>
                        <input type={type} placeholder={placeholder} required={required} step={step} value={form[field]}
                          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${themeColors.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: themeColors.text }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.muted, display: 'block', marginBottom: 5 }}>Gender</label>
                      <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${themeColors.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: themeColors.text, background: '#fff' }}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.muted, display: 'block', marginBottom: 5 }}>{t('bloodGroup')}</label>
                      <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${themeColors.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: themeColors.text, background: '#fff' }}>
                        {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <button type="submit" className="cp-btn cp-btn-teal" disabled={submitting}>{submitting ? `${t('loading')}...` : `✓ ${t('addChild')}`}</button>
                    <button type="button" className="cp-btn cp-btn-out" onClick={() => setShowForm(false)}>{t('cancel')}</button>
                  </div>
                </form>
              </div>
            )}

            {!selectedChild ? (
              <div className="cp-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>👶</div>
                <h4 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, color: themeColors.text, marginBottom: 10 }}>{t('noRecords')}</h4>
                <p style={{ color: themeColors.muted, fontSize: 14 }}>{t('addChild')} {t('myChild').toLowerCase()} to start tracking {t('growth').toLowerCase()}, {t('vaccines').toLowerCase()}, and {t('reports').toLowerCase()}.</p>
                <button className="cp-btn cp-btn-teal" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}>+ {t('addChild')}</button>
              </div>
            ) : (
              <>
                {/* Profile Hero Card */}
                <div style={{ background: `linear-gradient(135deg,${themeColors.teal2},${themeColors.teal})`, borderRadius: 20, padding: '28px 32px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', boxShadow: `0 8px 32px rgba(8,145,178,.22)`, animation: 'fadeUp .5s ease' }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '3px solid rgba(255,255,255,.5)', display: 'grid', placeItems: 'center', fontSize: 44, flexShrink: 0 }}>👶</div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{selectedChild.name}</h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[calcAge(selectedChild.dob), selectedChild.gender, selectedChild.bloodGroup].map((v, i) => (
                        <span key={i} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', color: '#fff', fontSize: 12, fontWeight: 600 }}>{v}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2-column grid */}
                <div className="cp-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
                  {/* Left: Personal Information */}
                  <div className="cp-card">
                    <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: themeColors.teal2, marginBottom: 16 }}>📋 {t('childInfoTitle')}</h5>
                    <InfoRow icon="🎂" label={t('dateOfBirth')} value={fmt(selectedChild.dob)} />
                    <InfoRow icon="⏳" label={t('age')} value={calcAge(selectedChild.dob)} />
                    <InfoRow icon="👤" label={t('gender')} value={selectedChild.gender} />
                    <InfoRow icon="🩸" label={t('bloodGroup')} value={selectedChild.bloodGroup} />
                    <InfoRow icon="📍" label={t('address')} value={selectedChild.location || selectedChild.village || '—'} />
                    <InfoRow icon="👩" label="Mother's Name" value={selectedChild.motherName || '—'} />
                    <InfoRow icon="👨" label="Father's Name" value={selectedChild.fatherName || '—'} />
                    <InfoRow icon="📞" label="Contact" value={selectedChild.contactPhone || '—'} />
                  </div>

                  {/* Right column */}
                  <div>
                    {/* ASHA Worker */}
                    <div className="cp-card" style={{ marginBottom: 0 }}>
                      <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: themeColors.teal2, marginBottom: 14 }}>👩‍⚕️ Assigned ASHA Worker</h5>
                      {selectedChild.ashaId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: themeColors.teal4, borderRadius: 12, border: `1px solid ${themeColors.border}` }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg,${themeColors.teal3},${themeColors.teal})`, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>👩‍⚕️</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: themeColors.text }}>{selectedChild.ashaId.userId?.name || 'ASHA Worker'}</div>
                            <div style={{ fontSize: 12, color: themeColors.muted, marginTop: 2 }}>
                              ID: {selectedChild.ashaId.ashaId} &nbsp;·&nbsp; {selectedChild.ashaId.block}{selectedChild.ashaId.village ? `, ${selectedChild.ashaId.village}` : ''}
                            </div>
                          </div>
                          {selectedChild.ashaId.userId?.phone && (
                            <a href={`tel:${selectedChild.ashaId.userId.phone}`} style={{ padding: '7px 14px', borderRadius: 8, background: themeColors.teal, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>📞 Call</a>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                          <span style={{ fontSize: 24 }}>⚠️</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#c2410c', fontSize: 14 }}>No ASHA Worker Assigned</div>
                            <div style={{ fontSize: 12, color: themeColors.muted, marginTop: 2 }}>An ASHA worker will be assigned by your health centre admin.</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upcoming Vaccines */}
                    <div className="cp-card" style={{ marginTop: 16, marginBottom: 0 }}>
                      <SideCardHeader title="💉 Upcoming Vaccines" linkTo="/parent/vaccination" linkText={vaccines.length ? `${vaccinesDone}/${vaccines.length} done` : 'View all'} />
                      {nextVaccines.length === 0 ? (
                        <div style={{ fontSize: 13, color: themeColors.muted }}>{vaccines.length ? '✅ All vaccines given' : 'No schedule yet.'}</div>
                      ) : nextVaccines.map((v) => {
                        const badge = VACCINE_BADGE[v.status] || VACCINE_BADGE.upcoming;
                        return (
                          <div key={v._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 12px', marginBottom: 6, background: themeColors.teal4, borderRadius: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: themeColors.text }}>{v.vaccineName}</div>
                              <div style={{ fontSize: 11, color: themeColors.muted }}>{fmt(v.dueDate)}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, borderRadius: 20, padding: '2px 10px', flexShrink: 0 }}>{badge.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Feeding now */}
                    {feedNow.length > 0 && (
                      <div className="cp-card" style={{ marginTop: 16, marginBottom: 0 }}>
                        <SideCardHeader title="🥗 Feeding Now" linkTo="/parent/diet-plan" linkText="Full plan" />
                        {feedNow.map((meal, i) => (
                          <div key={meal.time} style={{ padding: '9px 12px', marginBottom: 6, borderRadius: 10, background: i === 0 ? themeColors.teal4 : '#fff', border: `1px solid ${i === 0 ? themeColors.teal : themeColors.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: themeColors.text }}>
                              {meal.icon} {meal.name}
                              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: themeColors.teal2 }}>{nowMeal === -1 ? meal.time : `${i === 0 ? 'Now' : 'Next'} · ${meal.time}`}</span>
                            </div>
                            <div style={{ fontSize: 11, color: themeColors.muted, marginTop: 3 }}>{mealItemsText(meal)}</div>
                          </div>
                        ))}
                        {dietPlan.tips?.length > 0 && (
                          <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 12, color: themeColors.text, lineHeight: 1.7 }}>
                            {dietPlan.tips.slice(0, 3).map((tip) => <li key={tip}>{tip}</li>)}
                          </ul>
                        )}
                        {dietPlan.avoidFoods?.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', marginBottom: 6 }}>🚫 Avoid</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {dietPlan.avoidFoods.map((food) => (
                                <span key={food} style={{ fontSize: 11, background: '#fee2e2', color: '#b91c1c', borderRadius: 20, padding: '2px 10px' }}>{food}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <GrowthMonitoring child={selectedChild} onSaved={refreshSelectedChild} showForm={showGrowthForm} setShowForm={setShowGrowthForm} />
              </>
            )}
          </>
        )}
      </div>

      <footer style={{ background: '#0e7490', color: 'rgba(255,255,255,.45)', textAlign: 'center', padding: 14, fontSize: 12 }}>
        Shishu Aarogya &copy; 2024 &middot; {t('homeFooter_copyright_long') || 'National Child Health Portal · Government of India'}
      </footer>
    </div>
  );
}
