import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ashaAPI } from '../../services/api';

const SLIDES = ['https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1400&q=80&fit=crop'];

const NAV = [
  ['🏠 Dashboard',    '/asha/dashboard'],
  ['👶 Children',     '/asha/children'],
  ['📝 Log Visit',    '/asha/log-visit'],
  ['💉 Vaccines',     '/asha/vaccination-tracker'],
  ['📈 Growth',       '/asha/growth-records'],
  ['🚨 Malnutrition', '/asha/malnutrition-report'],
  ['📋 Visits',       '/asha/visit-history'],
  ['🔔 Alerts',       '/asha/notifications'],
];

const SS = {
  healthy:  { bg: '#f0fdf4', border: '#6ee7b7', color: '#059669', bbg: '#d1fae5', grad: 'linear-gradient(90deg,#059669,#34d399)', label: '✓ Healthy' },
  moderate: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', bbg: '#fef3c7', grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)', label: '⚠️ Moderate' },
  severe:   { bg: '#fff1f2', border: '#fca5a5', color: '#991b1b', bbg: '#fee2e2', grad: 'linear-gradient(90deg,#ef4444,#f87171)', label: '🚨 Severe' },
};
const st = (status) => SS[status] || SS.healthy;

const calcAge = (dob, ageInMonths) => {
  if (ageInMonths) return ageInMonths < 24 ? `${ageInMonths} mo` : `${Math.floor(ageInMonths / 12)} yr ${ageInMonths % 12} mo`;
  if (!dob) return '—';
  const months = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return months < 24 ? `${months} mo` : `${Math.floor(months / 12)} yr`;
};
const fmt = (d) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MyChildrenList() {
  const { user } = useAuth();
  const location = useLocation();

  const [children,  setChildren]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [view,      setView]      = useState('grid');
  const [expanded,  setExpanded]  = useState(null);

  const userInitial = (user?.name || 'A')[0].toUpperCase();

  useEffect(() => {
    ashaAPI.getMyChildren()
      .then(res => setChildren(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    all:      children.length,
    healthy:  children.filter(c => c.nutritionStatus === 'healthy').length,
    moderate: children.filter(c => c.nutritionStatus === 'moderate').length,
    severe:   children.filter(c => c.nutritionStatus === 'severe').length,
  };

  const filtered = children.filter(c => {
    const mf = filter === 'all' || c.nutritionStatus === filter;
    const ms = (c.name || '').toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#f0fdff', minHeight: '100vh', color: '#0c2340' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .an-nav-link{display:inline-flex;align-items:center;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:500;color:#0c2340;text-decoration:none;white-space:nowrap;transition:background .15s}
        .an-nav-link:hover{background:#cffafe;color:#0e7490}
        .an-nav-link.active{background:#e0f7fa;color:#0e7490;font-weight:700}
        .an-card{background:#fff;border:1.5px solid #c5e8ef;border-radius:14px;box-shadow:0 2px 12px rgba(8,145,178,.07)}
        .an-spinner{width:44px;height:44px;border:4px solid #cffafe;border-top-color:#0891b2;border-radius:50%;animation:spin .8s linear infinite}
        @media(max-width:768px){.an-navlinks{display:none!important}}
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', height: 64, borderBottom: '2px solid #cffafe', boxShadow: '0 2px 16px rgba(8,145,178,.10)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#0891b2,#0e7490)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏥</div>
          <div>
            <div style={{ fontFamily: "'Libre Baskerville',serif", fontWeight: 700, fontSize: 15, color: '#0e7490', lineHeight: 1.1 }}>Sishu Arogaya</div>
            <div style={{ fontSize: 10, color: '#4a7a8a' }}>ASHA Worker Portal</div>
          </div>
        </div>
        <div className="an-navlinks" style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
          {NAV.map(([label, to]) => <Link key={to} to={to} className={`an-nav-link${location.pathname === to ? ' active' : ''}`}>{label}</Link>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexShrink: 0 }}>
          <Link to="/asha/notifications" style={{ textDecoration: 'none', fontSize: 20 }}>🔔</Link>
          <Link to="/asha/settings" style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0891b2,#0e7490)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>{userInitial}</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${SLIDES[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(8,145,178,.92),rgba(14,116,144,.7))' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '0 48px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#cffafe', marginBottom: 8 }}>ASHA Worker Portal</div>
            <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>My Children List</h1>
            <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, margin: 0 }}>{children.length} assigned · Tap any card for details</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['✅', counts.healthy, 'Healthy'], ['⚠️', counts.moderate, 'Moderate'], ['🚨', counts.severe, 'Severe']].map(([ico, v, l]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '12px 14px', textAlign: 'center', minWidth: 64 }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{ico}</div>
                <div style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, fontWeight: 700, color: '#cffafe' }}>{v}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px 60px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, animation: 'fadeUp .4s ease' }}>
          <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 20, fontWeight: 700, margin: 0, color: '#0c2340' }}>👶 My Children</h2>
          <Link to="/asha/log-visit" style={{ padding: '9px 20px', borderRadius: 9, background: 'linear-gradient(135deg,#0891b2,#0e7490)', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>➕ Log Visit</Link>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20, animation: 'fadeUp .45s ease' }}>
          {[['👶','#0891b2',counts.all,'Total','All assigned'],['✅','#059669',counts.healthy,'Healthy','WAZ ≥ −1'],['⚠️','#f59e0b',counts.moderate,'Moderate','Monitor closely'],['🚨','#ef4444',counts.severe,'Severe','PHC referral due']].map(([ico,ac,v,lbl,sub])=>(
            <div key={lbl} className="an-card" style={{ padding:'16px 18px', borderLeft:`4px solid ${ac}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}><span style={{ fontSize:18 }}>{ico}</span><span style={{ fontSize:12, color:'#4a7a8a', fontWeight:500 }}>{lbl}</span></div>
              <div style={{ fontSize:24, fontWeight:700, color:'#0c2340' }}>{v}</div>
              <div style={{ fontSize:11, color:'#4a7a8a', marginTop:4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Search + filter + view toggle */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', animation: 'fadeUp .5s ease' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: .4 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by child name..."
              style={{ width: '100%', padding: '11px 12px 11px 38px', border: '1.5px solid #c5e8ef', borderRadius: 11, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#0c2340', background: '#f0fdff', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#0891b2'} onBlur={e => e.target.style.borderColor = '#c5e8ef'} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all','👥 All',counts.all],['healthy','✅ Healthy',counts.healthy],['moderate','⚠️ Moderate',counts.moderate],['severe','🚨 Severe',counts.severe]].map(([k,lbl,cnt])=>(
              <button key={k} onClick={()=>setFilter(k)}
                style={{ padding:'9px 12px', borderRadius:10, border:`1.5px solid ${filter===k?'#0891b2':'#c5e8ef'}`, background:filter===k?'#e0f7fa':'#fff', color:filter===k?'#0891b2':'#4a7a8a', fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {lbl} <span style={{ marginLeft:4, background:filter===k?'#0891b2':'#c5e8ef', color:'#fff', borderRadius:100, padding:'1px 7px', fontSize:10 }}>{cnt}</span>
              </button>
            ))}
          </div>
          <div style={{ display:'flex', border:'1px solid #c5e8ef', borderRadius:10, overflow:'hidden' }}>
            {[['grid','⊞'],['table','☰']].map(([k,ico])=>(
              <button key={k} onClick={()=>setView(k)}
                style={{ padding:'9px 14px', border:'none', background:view===k?'#e0f7fa':'#fff', color:view===k?'#0891b2':'#4a7a8a', fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, cursor:'pointer' }}>
                {ico}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><div className="an-spinner"/></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:18, fontWeight:700, color:'#0c2340' }}>No children found</div>
            <div style={{ fontSize:13, color:'#4a7a8a', marginTop:6 }}>Try adjusting your search or filter</div>
          </div>
        ) : view === 'grid' ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14, animation:'fadeUp .55s ease' }}>
            {filtered.map((c) => {
              const sc = st(c.nutritionStatus);
              const isOpen = expanded === c._id;
              return (
                <div key={c._id} style={{ background:'#fff', borderRadius:16, border:`1.5px solid ${isOpen?'#0891b2':sc.border}`, boxShadow:'0 2px 12px rgba(8,145,178,.08)', overflow:'hidden', transition:'all .3s' }}
                  onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.boxShadow='0 8px 28px rgba(8,145,178,.16)';}}
                  onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.boxShadow='0 2px 12px rgba(8,145,178,.08)';}}>
                  <div style={{ height:4, background:sc.grad }}/>
                  <div style={{ padding:'16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                        <div style={{ width:48, height:48, borderRadius:'50%', background:sc.bbg, border:`2px solid ${sc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👶</div>
                        <div>
                          <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:15, fontWeight:700, color:'#0c2340' }}>{c.name}</div>
                          <div style={{ fontSize:11, color:'#4a7a8a', marginTop:2 }}>{calcAge(c.dob, c.ageInMonths)}</div>
                        </div>
                      </div>
                      <span style={{ padding:'4px 10px', borderRadius:100, fontSize:10, fontWeight:700, background:sc.bbg, color:sc.color, border:`1px solid ${sc.border}` }}>{sc.label}</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, marginBottom:12 }}>
                      {[['⚖️',`${c.currentWeight??'—'} kg`,'Weight'],['📏',`${c.currentHeight??'—'} cm`,'Height'],['🩸',c.bloodGroup||'—','Blood']].map(([ico,val,lbl])=>(
                        <div key={lbl} style={{ padding:'8px', borderRadius:9, background:sc.bg, textAlign:'center', border:`1px solid ${sc.border}` }}>
                          <div style={{ fontSize:13 }}>{ico}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:'#0c2340' }}>{val}</div>
                          <div style={{ fontSize:9, color:'#4a7a8a' }}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:12, color:'#4a7a8a', marginBottom:12 }}>
                      ⚥ {c.gender || '—'}{c.dob ? ` · 📅 DOB: ${fmt(c.dob)}` : ''}
                    </div>
                    <button onClick={()=>setExpanded(isOpen?null:c._id)}
                      style={{ width:'100%', padding:'7px', borderRadius:9, border:`1px solid ${sc.border}`, background:isOpen?sc.bbg:'#fff', color:isOpen?sc.color:'#4a7a8a', fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      {isOpen?'▲ Hide Details':'▼ Show Details'}
                    </button>
                  </div>
                  {isOpen && (
                    <div style={{ padding:'0 16px 12px', borderTop:`1px solid ${sc.border}`, paddingTop:12 }}>
                      <div style={{ padding:'10px 12px', background:sc.bbg, borderRadius:9, fontSize:12, fontWeight:700, color:sc.color }}>
                        {c.nutritionStatus==='healthy'?'✅ Normal growth — continue current plan':c.nutritionStatus==='moderate'?'⚠️ Moderate risk — increase nutrients + weekly follow-up':'🚨 Severe malnutrition — PHC referral required TODAY'}
                      </div>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8, padding:'10px 14px', borderTop:`1px solid ${sc.border}`, background:sc.bg }}>
                    <Link to="/asha/log-visit" style={{ flex:1, padding:'9px', borderRadius:9, background:'linear-gradient(135deg,#0891b2,#0e7490)', color:'#fff', fontSize:11, fontWeight:700, textDecoration:'none', textAlign:'center' }}>📝 Log Visit</Link>
                    <Link to="/asha/growth-records" style={{ padding:'9px 12px', borderRadius:9, border:`1px solid ${sc.border}`, background:'#fff', fontSize:11, fontWeight:700, color:'#4a7a8a', textDecoration:'none' }}>📈</Link>
                    <Link to={`/asha/child/${c._id}`} style={{ padding:'9px 12px', borderRadius:9, border:'1px solid #c5e8ef', background:'#f0fdff', fontSize:11, fontWeight:700, color:'#0891b2', textDecoration:'none' }}>👁️</Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="an-card" style={{ padding:'20px 22px', animation:'fadeUp .55s ease' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f0fdff' }}>
                    {['#','Name','Age','Weight','Height','Blood','Gender','Status','Actions'].map(h=>(
                      <th key={h} style={{ padding:'9px 12px', textAlign:'left', color:'#4a7a8a', fontWeight:600, fontSize:11, borderBottom:'1px solid #c5e8ef', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c,i)=>{
                    const sc=st(c.nutritionStatus);
                    return(
                      <tr key={c._id} style={{ background:i%2?'#f0fdff':'#fff', borderBottom:'1px solid #e0f7fa' }}>
                        <td style={{ padding:'9px 12px', color:'#4a7a8a', fontWeight:700 }}>{i+1}</td>
                        <td style={{ padding:'9px 12px', fontWeight:700, color:'#0c2340' }}>👶 {c.name}</td>
                        <td style={{ padding:'9px 12px', color:'#4a7a8a' }}>{calcAge(c.dob,c.ageInMonths)}</td>
                        <td style={{ padding:'9px 12px', fontWeight:700 }}>{c.currentWeight??'—'} kg</td>
                        <td style={{ padding:'9px 12px', fontWeight:700 }}>{c.currentHeight??'—'} cm</td>
                        <td style={{ padding:'9px 12px', color:'#4a7a8a' }}>{c.bloodGroup||'—'}</td>
                        <td style={{ padding:'9px 12px', color:'#4a7a8a' }}>{c.gender||'—'}</td>
                        <td style={{ padding:'9px 12px' }}><span style={{ padding:'3px 9px', borderRadius:100, fontSize:10, fontWeight:700, background:sc.bbg, color:sc.color }}>{sc.label}</span></td>
                        <td style={{ padding:'9px 12px' }}>
                          <div style={{ display:'flex', gap:5 }}>
                            <Link to="/asha/log-visit" style={{ padding:'4px 10px', borderRadius:7, background:'linear-gradient(135deg,#0891b2,#0e7490)', color:'#fff', fontSize:10, fontWeight:700, textDecoration:'none' }}>📝 Log</Link>
                            <Link to={`/asha/child/${c._id}`} style={{ padding:'4px 8px', borderRadius:7, border:'1px solid #c5e8ef', background:'#f0fdff', color:'#0891b2', fontSize:10, fontWeight:700, textDecoration:'none' }}>👁️</Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <footer style={{ background:'#0e7490', color:'rgba(255,255,255,.5)', textAlign:'center', padding:'18px 24px', fontSize:12 }}>
        Sishu Arogaya © 2024 · Government Integrated Child Health Monitoring System · DBUU Dehradun
      </footer>
    </div>
  );
}
