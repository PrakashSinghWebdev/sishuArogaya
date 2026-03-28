import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { childAPI, reportAPI } from '../../services/api';
import useSelectedChild from '../../hooks/useSelectedChild';

const C = {
  teal: '#0891b2', teal2: '#0e7490', teal3: '#cffafe', teal4: '#f0fdff',
  bg: '#f8fffe', text: '#0c2340', muted: '#4a7a8a', border: '#c5e8ef',
};

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

const SLIDES = [
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1400&q=80&fit=crop',
  'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1400&q=80&fit=crop',
];

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

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.teal4, borderRadius: 10, marginBottom: 8 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.teal3, display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{value || '—'}</div>
      </div>
    </div>
  );
}

export default function ChildProfile() {
  const { children, selectedChild, selectedChildId, setSelectedChild, setChildren, loading } = useSelectedChild();
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [slide, setSlide] = useState(0);
  const slideRef = useRef(null);
  const [form, setForm] = useState({
    name: '', dob: '', gender: 'male', bloodGroup: 'Unknown', birthWeight: '', birthHeight: '',
  });
  const [editForm, setEditForm] = useState({
    currentWeight: selectedChild?.currentWeight || '',
    currentHeight: selectedChild?.currentHeight || '',
    headCircumference: selectedChild?.headCircumference || '',
    nutritionStatus: selectedChild?.nutritionStatus || 'healthy',
    medicalNotes: selectedChild?.medicalNotes || '',
  });

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await childAPI.add(form);
      const refreshed = await childAPI.list();
      setChildren(refreshed.data);
      if (refreshed.data[refreshed.data.length - 1]?._id) {
        setSelectedChild(refreshed.data[refreshed.data.length - 1]._id);
      }
      setShowForm(false);
      setForm({ name: '', dob: '', gender: 'male', bloodGroup: 'Unknown', birthWeight: '', birthHeight: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add child.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    try {
      await childAPI.update(selectedChild._id, editForm);
      const refreshed = await childAPI.get(selectedChild._id);
      setChildren(prev => prev.map(c => c._id === selectedChild._id ? refreshed.data : c));
      setSelectedChild(refreshed.data);
      setShowEditForm(false);
      alert('Health status updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdating(false);
    }
  };

  // Sync editForm when selectedChild changes
  useEffect(() => {
    if (selectedChild) {
      setEditForm({
        currentWeight: selectedChild.currentWeight || '',
        currentHeight: selectedChild.currentHeight || '',
        headCircumference: selectedChild.headCircumference || '',
        nutritionStatus: selectedChild.nutritionStatus || 'healthy',
        medicalNotes: selectedChild.medicalNotes || '',
      });
    }
  }, [selectedChild]);

  const [dlLoading, setDlLoading] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');

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

  const handleSetReminder = () => {
    const visitDate = selectedChild?.nextVisitDate
      ? new Date(selectedChild.nextVisitDate).toLocaleDateString('en-IN')
      : 'next scheduled visit';
    localStorage.setItem('sa_visit_reminder', JSON.stringify({
      childId: selectedChild?._id,
      childName: selectedChild?.name,
      visitDate,
      set: new Date().toISOString(),
    }));
    setReminderMsg(`✓ Reminder set for ${visitDate}`);
    setTimeout(() => setReminderMsg(''), 4000);
  };

  // Health score
  const status = selectedChild?.nutritionStatus || 'healthy';
  const healthScore = status === 'severe' ? 42 : status === 'moderate' ? 62 : 80;
  const circumference = 2 * Math.PI * 36;

  // WHO Z-scores
  const latestGrowth = selectedChild?.latestGrowth || {};
  const waz = latestGrowth.waz ?? null;
  const haz = latestGrowth.haz ?? null;
  const whz = latestGrowth.whz ?? null;
  const wazPct = waz !== null ? clamp(((waz + 3) / 6) * 100, 0, 100) : 50;
  const hazPct = haz !== null ? clamp(((haz + 3) / 6) * 100, 0, 100) : 50;
  const whzPct = whz !== null ? clamp(((whz + 3) / 6) * 100, 0, 100) : 50;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        .cp-card{background:#fff;border:1.5px solid ${C.border};border-radius:16px;box-shadow:0 2px 12px rgba(8,145,178,.07);padding:24px;margin-bottom:20px}
        .cp-btn{padding:9px 18px;border-radius:10px;font-weight:600;font-size:13px;cursor:pointer;border:none;transition:all .2s}
        .cp-btn-teal{background:${C.teal};color:#fff} .cp-btn-teal:hover{background:${C.teal2}}
        .cp-btn-out{background:#fff;color:${C.teal};border:1.5px solid ${C.border}} .cp-btn-out:hover{background:${C.teal4}}
        .meal-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(8,145,178,.13)!important}
        @media(max-width:900px){.cp-grid2{grid-template-columns:1fr!important}.cp-grid4{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:600px){.cp-grid4{grid-template-columns:1fr!important}.cp-nav-links{display:none!important}}
      `}</style>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', height: 62, boxShadow: '0 2px 12px rgba(8,145,178,.08)' }}>
        <Link to="/parent/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 24, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${C.teal},${C.teal2})`, borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 18 }}>🌿</div>
          <span style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 17, fontWeight: 700, color: C.teal2 }}>Sishu Arogaya</span>
        </Link>
        <div className="cp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflowX: 'auto' }}>
          {NAV.map(([label, to]) => (
            <Link key={to} to={to} style={{ padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', background: to === '/parent/child-profile' ? C.teal4 : 'transparent', color: to === '/parent/child-profile' ? C.teal : C.muted, borderBottom: to === '/parent/child-profile' ? `2px solid ${C.teal}` : '2px solid transparent' }}>
              {label}
            </Link>
          ))}
        </div>
        {children.length > 1 && (
          <select value={selectedChildId} onChange={(e) => setSelectedChild(e.target.value)} style={{ marginLeft: 12, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text, background: '#fff', fontFamily: 'inherit' }}>
            {children.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        {SLIDES.map((src, i) => (
          <img key={src} src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === slide ? 1 : 0, transition: 'opacity 1s ease' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${C.teal2}ee,${C.teal}bb)` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 14 }}>🏥 Child Profile</div>
          <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
            Child's Complete <span style={{ color: C.teal3 }}>Health Profile</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, marginTop: 8, textAlign: 'center' }}>Track growth, vaccines, nutrition &amp; ASHA support</p>
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 3 }}>
          {SLIDES.map((_, i) => <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 7, height: 7, borderRadius: 4, background: i === slide ? '#fff' : 'rgba(255,255,255,.45)', cursor: 'pointer', transition: 'all .3s' }} />)}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }}>👶 Child Profile</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="cp-btn cp-btn-out" onClick={() => setShowForm(true)} style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fed7aa' }}>
              ➕ Add New Child
            </button>
            {selectedChild && (
              <button className="cp-btn cp-btn-teal" onClick={() => setShowEditForm(!showEditForm)}>
                ✏️ {showEditForm ? 'Cancel Edit' : 'Edit Health Status'}
              </button>
            )}
            {selectedChild && (
              <button className="cp-btn cp-btn-out" onClick={handleDownload} disabled={dlLoading}>
                {dlLoading ? '⏳ Downloading…' : '⬇️ Download Report'}
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
            {/* Edit Health Status Form */}
            {showEditForm && selectedChild && (
              <div className="cp-card" style={{ animation: 'fadeUp .4s ease', marginBottom: 24 }}>
                <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 17, fontWeight: 700, color: C.teal2, marginBottom: 16 }}>✏️ Update {selectedChild.name}'s Health Status</h5>
                {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>}
                <form onSubmit={handleUpdate}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>Current Weight (kg)</label>
                      <input type="number" step="0.1" value={editForm.currentWeight} onChange={e => setEditForm({...editForm, currentWeight: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>Current Height (cm)</label>
                      <input type="number" step="0.1" value={editForm.currentHeight} onChange={e => setEditForm({...editForm, currentHeight: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>Head Circumference (cm)</label>
                      <input type="number" step="0.1" value={editForm.headCircumference} onChange={e => setEditForm({...editForm, headCircumference: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>Nutrition Status</label>
                      <select value={editForm.nutritionStatus} onChange={e => setEditForm({...editForm, nutritionStatus: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13 }}>
                        <option value="healthy">Healthy</option>
                        <option value="moderate">Moderate Malnutrition</option>
                        <option value="severe">Severe Malnutrition</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>Medical Notes</label>
                      <textarea rows="3" value={editForm.medicalNotes} onChange={e => setEditForm({...editForm, medicalNotes: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
                    <button type="submit" className="cp-btn cp-btn-teal" disabled={updating}>
                      {updating ? 'Updating...' : '💾 Save Changes'}
                    </button>
                    <button type="button" className="cp-btn cp-btn-out" onClick={() => { setShowEditForm(false); setError(''); }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Add Child Form */}
            {showForm && (
              <div className="cp-card" style={{ animation: 'fadeUp .4s ease', marginBottom: 24 }}>
                <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 17, fontWeight: 700, color: C.teal2, marginBottom: 16 }}>➕ Register New Child</h5>
                {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
                    {[
                      { label: 'Child Name', field: 'name', type: 'text', placeholder: 'Full name', required: true },
                      { label: 'Date of Birth', field: 'dob', type: 'date', required: true },
                      { label: 'Birth Weight (kg)', field: 'birthWeight', type: 'number', placeholder: '3.2', step: '0.1' },
                      { label: 'Birth Height (cm)', field: 'birthHeight', type: 'number', placeholder: '50', step: '0.1' },
                    ].map(({ label, field, type, placeholder, required, step }) => (
                      <div key={field}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>{label}</label>
                        <input type={type} placeholder={placeholder} required={required} step={step} value={form[field]}
                          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.text }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>Gender</label>
                      <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.text, background: '#fff' }}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 5 }}>Blood Group</label>
                      <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.text, background: '#fff' }}>
                        {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <button type="submit" className="cp-btn cp-btn-teal" disabled={submitting}>{submitting ? 'Saving…' : '✓ Register Child'}</button>
                    <button type="button" className="cp-btn cp-btn-out" onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {!selectedChild ? (
              <div className="cp-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>👶</div>
                <h4 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, color: C.text, marginBottom: 10 }}>No child registered yet</h4>
                <p style={{ color: C.muted, fontSize: 14 }}>Add a child profile to start tracking growth, vaccines, and reports.</p>
                <button className="cp-btn cp-btn-teal" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}>+ Add First Child</button>
              </div>
            ) : (
              <>
                {/* Profile Hero Card */}
                <div style={{ background: `linear-gradient(135deg,${C.teal2},${C.teal})`, borderRadius: 20, padding: '28px 32px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', boxShadow: `0 8px 32px rgba(8,145,178,.22)`, animation: 'fadeUp .5s ease' }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '3px solid rgba(255,255,255,.5)', display: 'grid', placeItems: 'center', fontSize: 44, flexShrink: 0 }}>👶</div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{selectedChild.name}</h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[calcAge(selectedChild.dob), selectedChild.gender, selectedChild.bloodGroup].map((v, i) => (
                        <span key={i} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', color: '#fff', fontSize: 12, fontWeight: 600 }}>{v}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ position: 'relative', width: 90, height: 90 }}>
                      <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="8" />
                        <circle cx="45" cy="45" r="36" fill="none" stroke="#fff" strokeWidth="8"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference - (healthScore / 100) * circumference}
                          strokeLinecap="round" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                        <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{healthScore}</div>
                      </div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 11, marginTop: 4 }}>Excellent ✓</div>
                  </div>
                </div>

                {/* Current Vitals Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
                  <span style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 14, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em' }}>Current Vitals</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                {/* Stat Grid */}
                <div className="cp-grid4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                  {[
                    { icon: '⚖️', label: 'Weight', value: selectedChild.currentWeight ? `${selectedChild.currentWeight} kg` : '—', color: C.teal, trend: '↑' },
                    { icon: '📏', label: 'Height', value: selectedChild.currentHeight ? `${selectedChild.currentHeight} cm` : '—', color: '#16a34a', trend: '↑' },
                    { icon: '🔵', label: 'Head Circ.', value: selectedChild.headCircumference ? `${selectedChild.headCircumference} cm` : '—', color: '#d97706', trend: '→' },
                    { icon: '📊', label: 'BMI', value: selectedChild.bmi ? selectedChild.bmi.toFixed(1) : '—', color: '#2563eb', trend: '↑' },
                  ].map(({ icon, label, value, color, trend }) => (
                    <div key={label} style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${C.border}`, padding: '18px 16px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 8px rgba(8,145,178,.06)', textAlign: 'center' }}>
                      <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{label}</div>
                      <div style={{ fontSize: 11, color: '#16a34a', marginTop: 3 }}>{trend} Normal</div>
                    </div>
                  ))}
                </div>

                {/* 2-column grid */}
                <div className="cp-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
                  {/* Left: Personal Information */}
                  <div className="cp-card">
                    <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: C.teal2, marginBottom: 16 }}>📋 Personal Information</h5>
                    <InfoRow icon="🎂" label="Date of Birth" value={fmt(selectedChild.dob)} />
                    <InfoRow icon="⏳" label="Age" value={calcAge(selectedChild.dob)} />
                    <InfoRow icon="👤" label="Gender" value={selectedChild.gender} />
                    <InfoRow icon="🩸" label="Blood Group" value={selectedChild.bloodGroup} />
                    <InfoRow icon="📍" label="Location" value={selectedChild.location || selectedChild.village || '—'} />
                    <InfoRow icon="👩" label="Mother's Name" value={selectedChild.motherName || '—'} />
                    <InfoRow icon="👨" label="Father's Name" value={selectedChild.fatherName || '—'} />
                    <InfoRow icon="📞" label="Contact" value={selectedChild.contactPhone || '—'} />
                    {selectedChild.ashaId ? (
                      <InfoRow icon="🏥" label="ASHA Worker" value={`${selectedChild.ashaId.userId?.name || 'ASHA'} · ${selectedChild.ashaId.ashaId}`} />
                    ) : (
                      <InfoRow icon="🏥" label="ASHA Worker" value="Not assigned" />
                    )}
                  </div>

                  {/* Right column */}
                  <div>
                    {/* WHO Z-Scores */}
                    <div className="cp-card" style={{ marginBottom: 0 }}>
                      <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: C.teal2, marginBottom: 16 }}>📊 WHO Z-Scores</h5>
                      {[
                        { label: 'WAZ (Weight-for-Age)', value: waz, pct: wazPct, color: C.teal },
                        { label: 'HAZ (Height-for-Age)', value: haz, pct: hazPct, color: '#2563eb' },
                        { label: 'WHZ (Weight-for-Height)', value: whz, pct: whzPct, color: '#16a34a' },
                      ].map(({ label, value, pct, color }) => (
                        <div key={label} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color }}>{value !== null ? value.toFixed(2) : '--'}</span>
                          </div>
                          <div style={{ height: 7, borderRadius: 4, background: C.teal3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width .6s ease' }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ fontSize: 11, color: '#16a34a', background: '#dcfce7', padding: '7px 12px', borderRadius: 8, marginTop: 4, fontWeight: 600 }}>✓ All scores within WHO normal range</div>
                    </div>

                    {/* Allergies */}
                    <div className="cp-card" style={{ marginTop: 16 }}>
                      <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: C.teal2, marginBottom: 12 }}>🚫 Allergies &amp; Medical Notes</h5>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#15803d', padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>✓ No known allergies</div>
                      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
                        {selectedChild.medicalNotes || 'No recent medical notes. Child is developing normally with regular check-ups.'}
                      </div>
                    </div>

                    {/* Next Visit */}
                    <div style={{ background: `linear-gradient(135deg,${C.teal2},${C.teal})`, borderRadius: 14, padding: '18px 20px', marginTop: 16, boxShadow: `0 4px 16px rgba(8,145,178,.18)` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Next Scheduled Visit</div>
                      <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                        {selectedChild.nextVisitDate ? fmt(selectedChild.nextVisitDate) : 'Contact ASHA worker'}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginBottom: 14 }}>
                        {selectedChild.ashaId?.village || 'Primary Health Centre'}
                      </div>
                      <button className="cp-btn" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.4)', fontSize: 12 }} onClick={handleSetReminder}>🔔 Set Reminder</button>
                      {reminderMsg && <div style={{ marginTop: 8, fontSize: 11, color: '#cffafe', fontWeight: 600 }}>{reminderMsg}</div>}
                    </div>

                    {/* ASHA Worker */}
                    <div className="cp-card" style={{ marginTop: 16 }}>
                      <h5 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 16, fontWeight: 700, color: C.teal2, marginBottom: 14 }}>👩‍⚕️ Assigned ASHA Worker</h5>
                      {selectedChild.ashaId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: C.teal4, borderRadius: 12, border: `1px solid ${C.border}` }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg,${C.teal3},${C.teal})`, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>👩‍⚕️</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{selectedChild.ashaId.userId?.name || 'ASHA Worker'}</div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                              ID: {selectedChild.ashaId.ashaId} &nbsp;·&nbsp; {selectedChild.ashaId.block}{selectedChild.ashaId.village ? `, ${selectedChild.ashaId.village}` : ''}
                            </div>
                          </div>
                          {selectedChild.ashaId.userId?.phone && (
                            <a href={`tel:${selectedChild.ashaId.userId.phone}`} style={{ padding: '7px 14px', borderRadius: 8, background: C.teal, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>📞 Call</a>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                          <span style={{ fontSize: 24 }}>⚠️</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#c2410c', fontSize: 14 }}>No ASHA Worker Assigned</div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>An ASHA worker will be assigned by your health centre admin.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ background: '#0e7490', color: 'rgba(255,255,255,.45)', textAlign: 'center', padding: 14, fontSize: 12 }}>
        Sishu Arogaya © 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
      </div>
    </div>
  );
}
