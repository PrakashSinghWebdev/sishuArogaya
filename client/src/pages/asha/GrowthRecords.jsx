import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { ashaAPI, growthAPI, reportAPI } from "../../services/api";

// ─── WHO Median Reference (boys/girls 0–18 months, index = ageMonths) ─────────
const WHO_WEIGHT = [3.3,4.5,5.6,6.4,7.0,7.5,7.9,8.3,8.6,8.9,9.2,9.4,9.6,9.8,10.0,10.1,10.3,10.4];
const WHO_HEIGHT = [49.9,54.7,58.4,61.4,63.9,65.9,67.6,69.2,70.6,72.0,73.3,74.5,75.7,76.9,78.0,79.1,80.2,81.2];

const MILESTONES_WEIGHT = [
  { ageM:1,  event:"💧 Started breastfeeding exclusively" },
  { ageM:6,  event:"🍲 Introduced solid foods" },
  { ageM:12, event:"🥛 Transitioned to cow milk" },
  { ageM:15, event:"🧂 Added mild spices to diet" },
];

const ADVICE = [
  { icon:"🥦", title:"Iron-rich foods",       desc:"Dal, spinach, fortified cereals, egg yolk — essential for brain development.", tag:"Nutrition"    },
  { icon:"🥛", title:"Dairy daily",            desc:"250ml milk or equivalent curd/paneer provides calcium and Vitamin D.",         tag:"Nutrition"    },
  { icon:"💧", title:"Hydration",              desc:"Offer 500–800ml water between meals. Avoid sugary drinks completely.",          tag:"Hydration"    },
  { icon:"🌞", title:"Sun exposure",           desc:"15 min morning sunlight boosts Vitamin D for strong bones and growth.",        tag:"Lifestyle"    },
  { icon:"😴", title:"Sleep: 11–14 hrs/day",  desc:"Growth hormone is released during deep sleep. Consistent schedule is key.",    tag:"Sleep"        },
  { icon:"🧠", title:"Stimulation",           desc:"Talk, sing, read to your child — brain grows fastest in the first 2 years.",   tag:"Development"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const whoIdx = (ageM) => Math.min(Math.max(Math.round(ageM), 0), 18);

const zStatus = (z) => {
  if (z >= -1)  return { status:"Normal",   color:"#16a34a", bg:"#dcfce7" };
  if (z >= -2)  return { status:"Mild",     color:"#d97706", bg:"#fef3c7" };
  if (z >= -3)  return { status:"Moderate", color:"#ea580c", bg:"#ffedd5" };
  return              { status:"Severe",    color:"#dc2626", bg:"#fee2e2" };
};

const zDetail = (type, z, name) => {
  const n = name || "The child";
  const v = z?.toFixed(1) ?? "—";
  const msgs = {
    waz: {
      Normal:   `${n} has a healthy weight for age (${v}). Continue current nutrition plan.`,
      Mild:     `${n} is mildly underweight (${v}). Increase calorie-dense foods like ghee, eggs and dal.`,
      Moderate: `${n} shows moderate underweight (${v}). Consult a pediatrician immediately.`,
      Severe:   `${n} is severely underweight (${v}). Urgent medical attention required.`,
    },
    haz: {
      Normal:   `${n}'s height is in normal range (${v}). Adequate sleep and nutrition supports growth.`,
      Mild:     `${n} shows mild stunting tendency (${v}). Focus on protein-rich foods and sleep.`,
      Moderate: `${n} shows moderate stunting (${v}). Seek pediatric consultation.`,
      Severe:   `${n} shows severe stunting (${v}). Urgent medical intervention needed.`,
    },
    whz: {
      Normal:   `Good body proportion for current height (${v}). No sign of wasting.`,
      Mild:     `Mild wasting detected (${v}). Increase energy-dense foods immediately.`,
      Moderate: `Moderate wasting (${v}). Therapeutic nutrition support needed.`,
      Severe:   `Severe acute malnutrition (${v}). Immediate medical care required.`,
    },
  };
  const level = zStatus(z).status;
  return msgs[type]?.[level] ?? `Z-score: ${v}`;
};

// ─── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, whoData, dataKey, color, maxVal, unit, title }) {
  const [hovered, setHovered] = useState(null);
  if (!data.length) return null;
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:600,color:"#7a9e88",marginBottom:12 }}>
        <span>{title}</span>
        <div style={{ display:"flex",gap:14 }}>
          <span style={{ display:"flex",alignItems:"center",gap:4 }}>
            <span style={{ width:12,height:4,background:color,display:"inline-block",borderRadius:2 }}></span>Child
          </span>
          <span style={{ display:"flex",alignItems:"center",gap:4 }}>
            <span style={{ width:12,height:4,background:"#f7c948",display:"inline-block",borderRadius:2,opacity:.7 }}></span>WHO median
          </span>
        </div>
      </div>
      <div style={{ display:"flex",alignItems:"flex-end",gap:6,height:140,position:"relative" }}>
        {[0.25,0.5,0.75,1].map(p => (
          <div key={p} style={{ position:"absolute",left:0,right:0,bottom:`${p*100}%`,height:1,background:"rgba(0,0,0,.05)",zIndex:0 }} />
        ))}
        {data.map((d, i) => {
          const val = d[dataKey];
          const who = whoData[whoIdx(d.ageM)];
          const pct = Math.min((val / maxVal) * 100, 100);
          const whoPct = Math.min((who / maxVal) * 100, 100);
          const isCur = d.current;
          return (
            <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,position:"relative",zIndex:1 }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {hovered === i && (
                <div style={{ position:"absolute",bottom:"105%",left:"50%",transform:"translateX(-50%)",background:"#0d1f14",color:"#fff",fontSize:11,fontWeight:700,padding:"6px 10px",borderRadius:8,whiteSpace:"nowrap",zIndex:10,boxShadow:"0 4px 12px rgba(0,0,0,.2)" }}>
                  {val}{unit} (WHO: {who}{unit})
                  <div style={{ position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",borderWidth:4,borderStyle:"solid",borderColor:"#0d1f14 transparent transparent transparent" }} />
                </div>
              )}
              <div style={{ position:"absolute",bottom:`${whoPct}%`,left:"10%",right:"10%",height:2,background:"#f7c948",opacity:.7,borderRadius:1,zIndex:2 }} />
              <div style={{ fontSize:9,fontWeight:700,color:isCur?"#1a7a4a":"#9ab8a4",marginBottom:2 }}>{val}</div>
              <div style={{ width:"100%",borderRadius:"4px 4px 0 0",height:`${pct}%`,background:isCur?`linear-gradient(180deg,${color},${color}cc)`:color+"55",border:isCur?`2px solid ${color}`:"none",transition:"height .8s cubic-bezier(.4,0,.2,1)",position:"relative",cursor:"pointer",minHeight:4 }}>
                {isCur && <div style={{ position:"absolute",top:-5,left:"50%",transform:"translateX(-50%)",width:8,height:8,borderRadius:"50%",background:"#f7c948",border:"2px solid #fff",zIndex:3 }} />}
              </div>
              <div style={{ fontSize:9,color:isCur?"#1a7a4a":"#9ab8a4",fontWeight:isCur?700:500,textAlign:"center",lineHeight:1.2 }}>{d.month.slice(0,3)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Z-Score Gauge ─────────────────────────────────────────────────────────────
function ZGauge({ value, label }) {
  const pct = ((value + 3) / 6) * 100;
  const color = value >= -2 && value <= 2 ? "#22c55e" : value < -2 ? "#ef4444" : "#f59e0b";
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6 }}>
        <span style={{ fontWeight:600,color:"#374a3e" }}>{label}</span>
        <span style={{ fontWeight:800,color,fontFamily:"'Playfair Display',serif",fontSize:15 }}>{value?.toFixed(1)}</span>
      </div>
      <div style={{ height:10,borderRadius:5,overflow:"hidden",position:"relative",background:"linear-gradient(90deg,#fca5a5 0%,#fcd34d 30%,#86efac 50%,#fcd34d 70%,#fca5a5 100%)" }}>
        <div style={{ position:"absolute",top:0,bottom:0,width:3,borderRadius:2,background:"#0d1f14",left:`calc(${pct}% - 1.5px)`,boxShadow:"0 0 4px rgba(0,0,0,.4)",transition:"left 1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",fontSize:9,color:"#9ab8a4",marginTop:3 }}>
        <span>-3 Severe</span><span>-2 Moderate</span><span>0 Median</span><span>+2 Above</span><span>+3</span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function GrowthRecords() {
  const [children, setChildren]     = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedChild, setSelectedChild] = useState(null);
  const [rawRecords, setRawRecords] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [activeTab, setActiveTab]   = useState("weight");
  const [form, setForm]             = useState({ ageMonths:"", weight:"", height:"", hc:"", notes:"" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]               = useState({ type:"", text:"" });

  // Load ASHA's children list
  useEffect(() => {
    ashaAPI.getMyChildren()
      .then(r => {
        setChildren(r.data);
        if (r.data.length === 1) setSelectedId(r.data[0]._id);
      })
      .catch(console.error);
  }, []);

  // Load records when selected child changes
  useEffect(() => {
    const child = children.find(c => c._id === selectedId) || null;
    setSelectedChild(child);
    setRawRecords([]);
    if (!selectedId) return;
    setLoading(true);
    growthAPI.getHistory(selectedId)
      .then(r => setRawRecords(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedId, children]);

  // Transform DB records → chart-friendly format
  const chartData = rawRecords.map((r, i) => {
    const d = new Date(r.recordedDate);
    const mon = d.toLocaleString("en-IN", { month:"short" });
    const yr  = String(d.getFullYear()).slice(2);
    return {
      month: `${mon}'${yr}`,
      age:   r.ageMonths === 0 ? "Birth" : `${r.ageMonths} mo`,
      ageM:  whoIdx(r.ageMonths),
      weight: r.weight,
      height: r.height,
      hc:    r.headCircumference || 0,
      waz:   r.wazScore   ?? 0,
      haz:   r.hazScore   ?? 0,
      whz:   r.whzScore   ?? 0,
      status: r.prediction,
      current: i === rawRecords.length - 1,
      _id: r._id,
      recordedDate: r.recordedDate,
      recordedBy:   r.recordedBy,
      notes:        r.notes,
    };
  });

  const latest = chartData.at(-1) ?? null;
  const prev   = chartData.at(-2) ?? null;
  const wGain  = latest && prev ? (latest.weight - prev.weight).toFixed(1) : null;
  const hGain  = latest && prev ? (latest.height - prev.height).toFixed(1) : null;

  // Dynamic interpretations from real data
  const interpretations = latest ? [
    { label:"Weight for Age (WAZ)",   value: latest.waz.toFixed(1), ...zStatus(latest.waz), detail: zDetail("waz", latest.waz, selectedChild?.name) },
    { label:"Height for Age (HAZ)",   value: latest.haz.toFixed(1), ...zStatus(latest.haz), detail: zDetail("haz", latest.haz, selectedChild?.name) },
    { label:"Weight for Height (WHZ)",value: latest.whz.toFixed(1), ...zStatus(latest.whz), detail: zDetail("whz", latest.whz, selectedChild?.name) },
    {
      label:"BMI for Age",
      value: latest.height > 0 ? (latest.weight / ((latest.height / 100) ** 2)).toFixed(1) : "—",
      ...zStatus(0),
      detail:`BMI calculated from current weight (${latest.weight} kg) and height (${latest.height} cm).`,
    },
  ] : [];

  // Submit new measurement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type:"", text:"" });
    try {
      await growthAPI.add({
        childId: selectedId,
        ageMonths: parseFloat(form.ageMonths),
        weight:    parseFloat(form.weight),
        height:    parseFloat(form.height),
        ...(form.hc ? { headCircumference: parseFloat(form.hc) } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      });
      setMsg({ type:"success", text:"✅ Measurement saved successfully!" });
      setForm({ ageMonths:"", weight:"", height:"", hc:"", notes:"" });
      const r = await growthAPI.getHistory(selectedId);
      setRawRecords(r.data);
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.message || "Failed to save. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // Export PDF
  const handleExport = async () => {
    if (!selectedId) return;
    try {
      const res = await reportAPI.childPDF(selectedId);
      const url = URL.createObjectURL(new Blob([res.data], { type:"application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedChild?.name || "child"}-growth-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    }
  };

  const tabs = [
    { id:"weight", label:"⚖️ Weight",   color:"#2eb872" },
    { id:"height", label:"📏 Height",   color:"#3b82f6" },
    { id:"zscore", label:"📊 Z-Scores", color:"#8b5cf6" },
    { id:"table",  label:"📋 Records",  color:"#f59e0b" },
  ];

  const cName = selectedChild?.name || "—";

  return (
    <Layout role="asha">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Nunito:wght@400;600;700;800&display=swap');
        .gr-root *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}
        .gr-fade{animation:fadeUp .4s both}
        .gr-card:hover{transform:translateY(-2px)!important}
      `}</style>

      <div className="gr-root" style={{ fontFamily:"'Nunito',sans-serif" }}>

        {/* ── Child Selector ── */}
        <div style={{ background:"#fff",borderRadius:14,border:"1px solid #ddeae0",padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:16,boxShadow:"0 2px 8px rgba(0,0,0,.05)",flexWrap:"wrap" }}>
          <div style={{ fontSize:22 }}>👶</div>
          <div style={{ flex:1,minWidth:200 }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#7a9e88",marginBottom:5,letterSpacing:".06em",textTransform:"uppercase" }}>Select Child to View Growth Data</div>
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setActiveTab("weight"); }}
              style={{ width:"100%",maxWidth:420,padding:"9px 14px",borderRadius:9,border:"1.5px solid #c8e4d4",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:600,color:"#0d1f14",background:"#f0faf5",outline:"none",cursor:"pointer" }}>
              <option value="">— Select a child —</option>
              {children.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} · {c.ageInMonths} months · {c.nutritionStatus}
                </option>
              ))}
            </select>
          </div>
          {selectedChild && (
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderRadius:12,background:"#f0faf5",border:"1px solid #c8e4d4" }}>
              <div style={{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#2eb872,#1a7a4a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff" }}>
                {selectedChild.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:"#0d1f14" }}>{selectedChild.name}</div>
                <div style={{ fontSize:11,color:"#7a9e88" }}>{selectedChild.ageInMonths} months · {selectedChild.gender}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Empty: no child selected ── */}
        {!selectedId && (
          <div style={{ textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:18,border:"1px solid #ddeae0" }}>
            <div style={{ fontSize:52,marginBottom:16 }}>📈</div>
            <div style={{ fontSize:18,fontWeight:700,color:"#0d1f14",marginBottom:8,fontFamily:"'Playfair Display',serif" }}>Select a Child to Begin</div>
            <div style={{ fontSize:14,color:"#7a9e88" }}>Choose a child from the dropdown above to view and manage their growth monitoring data.</div>
          </div>
        )}

        {/* ── Loading ── */}
        {selectedId && loading && (
          <div style={{ textAlign:"center",padding:"60px",color:"#7a9e88",fontSize:15 }}>
            <div style={{ fontSize:36,marginBottom:12 }}>⏳</div>
            Loading growth data for {selectedChild?.name}...
          </div>
        )}

        {/* ── Main Content ── */}
        {selectedId && !loading && (
          <>
            {/* ── Hero Banner ── */}
            <div style={{ background:"linear-gradient(135deg,#0a3520 0%,#145c38 50%,#1e8050 100%)",borderRadius:18,position:"relative",overflow:"hidden",marginBottom:22 }}>
              <div style={{ position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)",backgroundSize:"26px 26px",pointerEvents:"none" }} />
              <div style={{ position:"absolute",top:-80,right:-80,width:320,height:320,borderRadius:"50%",background:"rgba(255,255,255,.04)",pointerEvents:"none" }} />

              <div style={{ position:"relative",zIndex:1,padding:"28px 28px 0" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:20 }}>
                  <span>ASHA Dashboard</span><span>›</span>
                  <span style={{ color:"rgba(255,255,255,.7)" }}>Growth Records</span><span>›</span>
                  <span style={{ color:"#f7c948",fontWeight:600 }}>{cName}</span>
                </div>

                <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:28,flexWrap:"wrap",paddingBottom:28 }}>
                  <div style={{ flex:1,minWidth:260 }}>
                    <div style={{ display:"inline-flex",alignItems:"center",gap:7,background:"rgba(247,201,72,.15)",border:"1px solid rgba(247,201,72,.35)",borderRadius:100,padding:"5px 16px",fontSize:11,fontWeight:700,color:"#f7c948",letterSpacing:".08em",textTransform:"uppercase",marginBottom:14 }}>
                      <span style={{ width:6,height:6,background:"#f7c948",borderRadius:"50%",animation:"pulse 2s infinite",display:"inline-block" }} />
                      {cName} · {selectedChild?.ageInMonths} months
                    </div>
                    <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,2.5vw,36px)",fontWeight:700,color:"#fff",lineHeight:1.15,marginBottom:8 }}>
                      Growth<br /><span style={{ color:"#f7c948" }}>Monitoring</span>
                    </h1>
                    <p style={{ fontSize:13,color:"rgba(255,255,255,.6)",maxWidth:380,lineHeight:1.7,marginBottom:16 }}>
                      Tracking weight, height, and nutrition status against WHO Child Growth Standards.
                    </p>
                    {latest && (
                      <div style={{ display:"inline-flex",alignItems:"center",gap:10,background:`rgba(${zStatus(latest.waz).status==="Normal"?"34,197,94":"239,68,68"},.15)`,border:`1px solid rgba(${zStatus(latest.waz).status==="Normal"?"34,197,94":"239,68,68"},.3)`,borderRadius:12,padding:"10px 16px" }}>
                        <div style={{ width:10,height:10,borderRadius:"50%",background:zStatus(latest.waz).color,animation:"pulse 2s infinite" }} />
                        <span style={{ fontSize:13,fontWeight:700,color:zStatus(latest.waz).status==="Normal"?"#86efac":"#fca5a5" }}>
                          {zStatus(latest.waz).status} Growth · WAZ {latest.waz.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {!latest && (
                      <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(247,201,72,.12)",border:"1px solid rgba(247,201,72,.3)",borderRadius:12,padding:"10px 16px",fontSize:13,color:"#f7c948",fontWeight:600 }}>
                        ⚠️ No growth records yet. Add the first measurement using the form →
                      </div>
                    )}
                  </div>

                  {/* Vital cards */}
                  {latest && (
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,flexShrink:0 }}>
                      {[
                        { icon:"⚖️", label:"Current Weight", val:latest.weight, unit:"kg",  gain:wGain?`+${wGain} kg`:"First record", who:`WHO: ${WHO_WEIGHT[latest.ageM]}kg`, color:"#f7c948" },
                        { icon:"📏", label:"Current Height", val:latest.height, unit:"cm",  gain:hGain?`+${hGain} cm`:"First record", who:`WHO: ${WHO_HEIGHT[latest.ageM]}cm`, color:"#7dd3fc" },
                        { icon:"🔵", label:"Head Circumference", val:latest.hc||"—", unit:latest.hc?"cm":"", gain:"",  who:"WHO: 47.0cm", color:"#c4b5fd" },
                        { icon:"📊", label:"WAZ Score",     val:latest.waz.toFixed(1), unit:"", gain:zStatus(latest.waz).status, who:"Normal: −2 to +2", color:zStatus(latest.waz).color },
                      ].map(c => (
                        <div key={c.label} style={{ background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12,padding:"14px 16px",backdropFilter:"blur(8px)" }}>
                          <div style={{ fontSize:14,marginBottom:5 }}>{c.icon}</div>
                          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:c.color,lineHeight:1 }}>
                            {c.val}<span style={{ fontSize:12,fontWeight:500,marginLeft:2,color:"rgba(255,255,255,.55)" }}>{c.unit}</span>
                          </div>
                          <div style={{ fontSize:10,color:"rgba(255,255,255,.5)",margin:"3px 0 2px" }}>{c.label}</div>
                          <div style={{ display:"flex",justifyContent:"space-between" }}>
                            {c.gain && <span style={{ fontSize:10,fontWeight:700,color:"#86efac" }}>↑ {c.gain}</span>}
                            <span style={{ fontSize:9,color:"rgba(255,255,255,.35)" }}>{c.who}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" style={{ display:"block",marginTop:-1 }}>
                <path d="M0,20 C360,42 1080,0 1440,20 L1440,40 L0,40 Z" fill="#f0f7f3" />
              </svg>
            </div>

            {/* ── Main Grid ── */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 300px",gap:20,alignItems:"start" }}>

              {/* LEFT */}
              <div style={{ display:"flex",flexDirection:"column",gap:20 }}>

                {/* Chart card */}
                <div className="gr-fade" style={{ background:"#fff",borderRadius:18,border:"1px solid #ddeae0",boxShadow:"0 2px 12px rgba(0,0,0,.06)",overflow:"hidden" }}>
                  {/* Tab bar */}
                  <div style={{ display:"flex",borderBottom:"1px solid #e8f0ea",background:"#f8fdf9" }}>
                    {tabs.map(t => (
                      <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex:1,padding:"13px 8px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,fontWeight:700,color:activeTab===t.id?t.color:"#7a9e88",borderBottom:activeTab===t.id?`3px solid ${t.color}`:"3px solid transparent",transition:"all .25s" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding:"22px" }}>
                    {/* No records message */}
                    {!latest && (
                      <div style={{ textAlign:"center",padding:"40px 20px",color:"#9ab8a4" }}>
                        <div style={{ fontSize:36,marginBottom:10 }}>📋</div>
                        <div style={{ fontSize:14,fontWeight:600,color:"#374a3e" }}>No records yet</div>
                        <div style={{ fontSize:12,marginTop:4 }}>Add the first measurement using the form on the right.</div>
                      </div>
                    )}

                    {/* Weight Tab */}
                    {activeTab === "weight" && latest && (
                      <div style={{ animation:"fadeUp .3s both" }}>
                        <BarChart data={chartData} whoData={WHO_WEIGHT} dataKey="weight" color="#2eb872" maxVal={14} unit="kg" title="Weight (kg) vs WHO median" />
                        <div style={{ marginTop:18,padding:"13px 15px",background:"#f0faf5",borderRadius:10,border:"1px solid #c8e4d4",fontSize:13,color:"#1a5c35",lineHeight:1.65 }}>
                          <strong>📊 What this means:</strong> {cName}'s weight at {selectedChild?.ageInMonths} months is <strong>{latest.weight} kg</strong>, compared to the WHO median of <strong>{WHO_WEIGHT[latest.ageM]} kg</strong>. WAZ score is <strong>{latest.waz.toFixed(1)}</strong> — {zStatus(latest.waz).status.toLowerCase()} range.
                        </div>
                        <div style={{ marginTop:16 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:"#0d1f14",marginBottom:10 }}>📌 Key Feeding Milestones</div>
                          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                            {MILESTONES_WEIGHT.map((m, i) => (
                              <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:"#f8fdf9",border:"1px solid #ddeae0" }}>
                                <div style={{ width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#2eb872,#1a7a4a)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800,flexShrink:0 }}>{m.ageM}m</div>
                                <span style={{ fontSize:13,color:"#374a3e" }}>{m.event}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Height Tab */}
                    {activeTab === "height" && latest && (
                      <div style={{ animation:"fadeUp .3s both" }}>
                        <BarChart data={chartData} whoData={WHO_HEIGHT} dataKey="height" color="#3b82f6" maxVal={100} unit="cm" title="Height (cm) vs WHO median" />
                        <div style={{ marginTop:18,padding:"13px 15px",background:"#eff6ff",borderRadius:10,border:"1px solid #93c5fd",fontSize:13,color:"#1e3a5f",lineHeight:1.65 }}>
                          <strong>📊 What this means:</strong> {cName}'s height at {selectedChild?.ageInMonths} months is <strong>{latest.height} cm</strong>, compared to the WHO median of <strong>{WHO_HEIGHT[latest.ageM]} cm</strong>. HAZ score is <strong>{latest.haz.toFixed(1)}</strong> — {zStatus(latest.haz).status.toLowerCase()} range.
                        </div>
                        {/* Height gain table */}
                        {chartData.length > 1 && (
                          <div style={{ marginTop:16,background:"#fff",borderRadius:10,border:"1px solid #ddeae0",overflow:"hidden" }}>
                            <div style={{ background:"#f0f7ff",padding:"10px 16px",fontSize:12,fontWeight:700,color:"#1e40af",borderBottom:"1px solid #ddeae0" }}>Height Gain per Visit vs Expected</div>
                            {chartData.slice(1).map((d, i) => {
                              const p = chartData[i];
                              const gain = (d.height - p.height).toFixed(1);
                              const exp = i < 3 ? 4 : i < 5 ? 2 : 1;
                              const ok = parseFloat(gain) >= exp * 0.7;
                              return (
                                <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"9px 14px",borderBottom:i < chartData.length - 2 ? "1px solid #f0f4f0":"none",background:i%2?"#fafcff":"#fff" }}>
                                  <div style={{ width:50,fontSize:11,fontWeight:600,color:"#5a7a64" }}>{d.age}</div>
                                  <div style={{ flex:1,height:7,background:"#e8f0ea",borderRadius:4,overflow:"hidden" }}>
                                    <div style={{ width:`${Math.min((parseFloat(gain)/6)*100,100)}%`,height:"100%",borderRadius:4,background:ok?"linear-gradient(90deg,#3b82f6,#1d4ed8)":"linear-gradient(90deg,#fca5a5,#ef4444)",transition:"width 1s" }} />
                                  </div>
                                  <div style={{ fontSize:12,fontWeight:700,color:ok?"#1d4ed8":"#b91c1c",width:46,textAlign:"right" }}>+{gain}cm</div>
                                  <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:100,background:ok?"#dbeafe":"#fee2e2",color:ok?"#1e40af":"#b91c1c" }}>{ok?"✓ Good":"⚠ Low"}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Z-Score Tab */}
                    {activeTab === "zscore" && latest && (
                      <div style={{ animation:"fadeUp .3s both" }}>
                        <div style={{ fontSize:13,fontWeight:700,color:"#0d1f14",marginBottom:14 }}>WHO Z-Score Gauges — Latest Visit</div>
                        <ZGauge value={latest.waz} label="Weight for Age (WAZ)" />
                        <ZGauge value={latest.haz} label="Height for Age (HAZ)" />
                        <ZGauge value={latest.whz} label="Weight for Height (WHZ)" />
                        <div style={{ background:"#f0faf5",borderRadius:10,padding:"13px 15px",border:"1px solid #c8e4d4",marginTop:16 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:"#0d4a2e",marginBottom:8 }}>How to read Z-scores:</div>
                          {[["0 to −1","Normal — optimal growth"],["−1 to −2","Mild undernutrition — monitor closely"],["−2 to −3","Moderate malnutrition — action needed"],["< −3","Severe malnutrition — urgent care required"]].map(([range, meaning]) => (
                            <div key={range} style={{ display:"flex",gap:10,marginBottom:5,fontSize:12 }}>
                              <span style={{ fontWeight:700,color:"#1a7a4a",minWidth:90 }}>{range}</span>
                              <span style={{ color:"#374a3e" }}>{meaning}</span>
                            </div>
                          ))}
                        </div>
                        {/* WAZ trend dots */}
                        {chartData.length > 1 && (
                          <>
                            <div style={{ fontSize:13,fontWeight:700,color:"#0d1f14",marginTop:18,marginBottom:10 }}>WAZ Trend Over Time</div>
                            <div style={{ display:"flex",alignItems:"flex-end",gap:8,height:70,position:"relative" }}>
                              <div style={{ position:"absolute",left:0,right:0,bottom:"33%",height:1.5,background:"repeating-linear-gradient(90deg,#ef4444 0,#ef4444 6px,transparent 6px,transparent 12px)",opacity:.5 }} />
                              <div style={{ position:"absolute",left:0,right:0,bottom:"67%",height:1.5,background:"repeating-linear-gradient(90deg,#f7c948 0,#f7c948 6px,transparent 6px,transparent 12px)",opacity:.5 }} />
                              {chartData.map((d, i) => {
                                const pct = ((d.waz + 3) / 6) * 100;
                                return (
                                  <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                                    <div style={{ fontSize:8,fontWeight:700,color:d.current?"#8b5cf6":"#9ab8a4" }}>{d.waz.toFixed(1)}</div>
                                    <div style={{ width:8,height:8,borderRadius:"50%",background:d.current?"#8b5cf6":"#c4b5fd",border:d.current?"2px solid #7c3aed":"1px solid #ddd8fe" }} />
                                    <div style={{ fontSize:8,color:d.current?"#7c3aed":"#9ab8a4",fontWeight:d.current?700:400,textAlign:"center" }}>{d.month.slice(0,3)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Records Table */}
                    {activeTab === "table" && (
                      <div style={{ animation:"fadeUp .3s both",overflowX:"auto" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                          <div style={{ fontSize:14,fontWeight:700,color:"#0d1f14" }}>Complete Growth Records</div>
                          <button onClick={handleExport} style={{ padding:"8px 14px",borderRadius:9,background:"linear-gradient(135deg,#1a7a4a,#0d4a2e)",color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer" }}>📥 Export PDF</button>
                        </div>
                        {!chartData.length ? (
                          <div style={{ textAlign:"center",padding:"30px",color:"#9ab8a4",fontSize:13 }}>No records found. Add the first measurement.</div>
                        ) : (
                          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
                            <thead>
                              <tr style={{ background:"#f0f7f3" }}>
                                {["Date","Age","Weight","Height","Head Circ.","WAZ","HAZ","WHZ","Status","Recorded By"].map(h => (
                                  <th key={h} style={{ padding:"9px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:"#7a9e88",textTransform:"uppercase",letterSpacing:".05em",borderBottom:"2px solid #ddeae0",whiteSpace:"nowrap" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[...chartData].reverse().map((d, i) => (
                                <tr key={d._id} style={{ background:d.current?"#f0faf5":i%2?"#fafcfa":"#fff",borderBottom:"1px solid #e8f0ea" }}>
                                  <td style={{ padding:"10px 10px",fontWeight:600,color:d.current?"#1a7a4a":"#374a3e",whiteSpace:"nowrap" }}>
                                    {new Date(d.recordedDate).toLocaleDateString("en-IN")}
                                  </td>
                                  <td style={{ padding:"10px 10px",color:"#5a7a64" }}>{d.age}</td>
                                  <td style={{ padding:"10px 10px",fontWeight:700,color:d.current?"#1a7a4a":"#0d1f14" }}>{d.weight} kg</td>
                                  <td style={{ padding:"10px 10px",fontWeight:700,color:d.current?"#2563eb":"#0d1f14" }}>{d.height} cm</td>
                                  <td style={{ padding:"10px 10px",color:"#5a7a64" }}>{d.hc ? `${d.hc} cm` : "—"}</td>
                                  <td style={{ padding:"10px 10px",color:zStatus(d.waz).color,fontWeight:700 }}>{d.waz.toFixed(1)}</td>
                                  <td style={{ padding:"10px 10px",color:zStatus(d.haz).color,fontWeight:700 }}>{d.haz.toFixed(1)}</td>
                                  <td style={{ padding:"10px 10px",color:zStatus(d.whz).color,fontWeight:700 }}>{d.whz.toFixed(1)}</td>
                                  <td style={{ padding:"10px 10px" }}>
                                    <span style={{ padding:"3px 10px",borderRadius:100,fontSize:10,fontWeight:700,background:zStatus(d.waz).bg,color:zStatus(d.waz).color }}>
                                      {d.current ? `⭐ ${zStatus(d.waz).status}` : zStatus(d.waz).status}
                                    </span>
                                  </td>
                                  <td style={{ padding:"10px 10px",fontSize:11,color:"#9ab8a4" }}>{d.recordedBy?.name || "ASHA"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Interpretations */}
                {interpretations.length > 0 && (
                  <div className="gr-fade">
                    <div style={{ fontSize:15,fontWeight:800,fontFamily:"'Playfair Display',serif",color:"#0d1f14",marginBottom:12 }}>📋 What the Numbers Mean</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                      {interpretations.map(r => (
                        <div key={r.label} className="gr-card" style={{ background:"#fff",borderRadius:14,border:"1px solid #ddeae0",padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,.05)",transition:"all .25s" }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                            <div style={{ fontSize:12,fontWeight:700,color:"#0d1f14" }}>{r.label}</div>
                            <span style={{ padding:"2px 10px",borderRadius:100,fontSize:11,fontWeight:800,background:r.bg,color:r.color }}>{r.status}</span>
                          </div>
                          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:r.color,marginBottom:6 }}>{r.value}</div>
                          <div style={{ fontSize:12,color:"#5a7a64",lineHeight:1.6 }}>{r.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advice cards */}
                <div className="gr-fade">
                  <div style={{ fontSize:15,fontWeight:800,fontFamily:"'Playfair Display',serif",color:"#0d1f14",marginBottom:12 }}>💡 Tips to Support {cName}'s Growth</div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
                    {ADVICE.map(a => (
                      <div key={a.title} className="gr-card" style={{ background:"#fff",borderRadius:14,border:"1px solid #ddeae0",padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,.05)",transition:"all .28s" }}>
                        <div style={{ fontSize:26,marginBottom:8 }}>{a.icon}</div>
                        <div style={{ fontSize:13,fontWeight:800,color:"#0d1f14",marginBottom:4 }}>{a.title}</div>
                        <div style={{ fontSize:12,color:"#5a7a64",lineHeight:1.6,marginBottom:8 }}>{a.desc}</div>
                        <span style={{ padding:"2px 10px",borderRadius:100,fontSize:10,fontWeight:700,background:"#f0faf5",color:"#1a7a4a",border:"1px solid #c8e4d4" }}>{a.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT SIDEBAR */}
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

                {/* Log measurement form */}
                <div style={{ background:"linear-gradient(135deg,#1a7a4a,#0d4a2e)",borderRadius:16,padding:"20px",boxShadow:"0 6px 20px rgba(13,74,46,.25)",position:"relative",overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:-28,right:-28,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.06)" }} />
                  <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,.55)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6 }}>📝 Log New Measurement</div>
                  <div style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:"#fff",marginBottom:14 }}>Record Growth for {cName}</div>

                  {msg.text && (
                    <div style={{ marginBottom:12,padding:"9px 12px",borderRadius:9,background:msg.type==="success"?"rgba(34,197,94,.2)":"rgba(239,68,68,.2)",border:`1px solid ${msg.type==="success"?"rgba(34,197,94,.4)":"rgba(239,68,68,.4)"}`,fontSize:12,fontWeight:600,color:msg.type==="success"?"#86efac":"#fca5a5" }}>
                      {msg.text}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:14 }}>
                      {[
                        ["ageMonths","Age (months) *","e.g. 18","number"],
                        ["weight","Weight (kg) *","e.g. 8.3","number"],
                        ["height","Height (cm) *","e.g. 74.0","number"],
                        ["hc","Head Circ. (cm)","e.g. 46.5","number"],
                        ["notes","Notes","Optional notes","text"],
                      ].map(([key, lbl, ph, type]) => (
                        <div key={key}>
                          <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,.55)",marginBottom:3,letterSpacing:".05em" }}>{lbl}</div>
                          <input
                            type={type}
                            step={type==="number"?"0.1":undefined}
                            min={type==="number"?"0":undefined}
                            placeholder={ph}
                            value={form[key]}
                            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                            required={lbl.includes("*")}
                            style={{ width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff",fontFamily:"'Nunito',sans-serif",fontSize:13,outline:"none" }}
                          />
                        </div>
                      ))}
                    </div>
                    <button type="submit" disabled={submitting} style={{ width:"100%",padding:"12px",borderRadius:10,background:submitting?"rgba(247,201,72,.5)":"#f7c948",color:"#0d4a2e",border:"none",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:800,cursor:submitting?"not-allowed":"pointer",transition:"all .25s" }}>
                      {submitting ? "⏳ Saving..." : "💾 Save Measurement"}
                    </button>
                  </form>
                </div>

                {/* WHO Reference */}
                <div style={{ background:"#fff",borderRadius:14,border:"1px solid #ddeae0",boxShadow:"0 2px 8px rgba(0,0,0,.05)",padding:"16px" }}>
                  <div style={{ fontSize:12,fontWeight:700,color:"#0d1f14",marginBottom:12 }}>
                    📏 WHO Reference — {selectedChild?.ageInMonths} months ({selectedChild?.gender})
                  </div>
                  {latest && [
                    ["Median Weight", `${WHO_WEIGHT[latest.ageM]} kg`, `Child: ${latest.weight} kg`],
                    ["Median Height", `${WHO_HEIGHT[latest.ageM]} cm`, `Child: ${latest.height} cm`],
                    ["WAZ (target)",  "−1 to +1",                      `Child: ${latest.waz.toFixed(1)}`],
                    ["HAZ (target)",  "−1 to +1",                      `Child: ${latest.haz.toFixed(1)}`],
                  ].map(([lbl, who, child]) => (
                    <div key={lbl} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f4f0" }}>
                      <div>
                        <div style={{ fontSize:12,fontWeight:600,color:"#374a3e" }}>{lbl}</div>
                        <div style={{ fontSize:10,color:"#9ab8a4",marginTop:1 }}>{child}</div>
                      </div>
                      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1a7a4a" }}>{who}</div>
                    </div>
                  ))}
                  {!latest && <div style={{ fontSize:12,color:"#9ab8a4",textAlign:"center",padding:"12px 0" }}>Add a record to see comparison.</div>}
                </div>

                {/* Growth Velocity */}
                {latest && prev && (
                  <div style={{ background:"#fff",borderRadius:14,border:"1px solid #ddeae0",boxShadow:"0 2px 8px rgba(0,0,0,.05)",padding:"16px" }}>
                    <div style={{ fontSize:12,fontWeight:700,color:"#0d1f14",marginBottom:12 }}>🚀 Growth Velocity (last 2 visits)</div>
                    {[
                      ["⚖️ Weight gain", wGain, "kg", 2.0],
                      ["📏 Height gain", hGain, "cm", 3.0],
                    ].map(([label, gain, unit, maxBar]) => {
                      const ok = parseFloat(gain) > 0;
                      return (
                        <div key={label} style={{ marginBottom:12 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
                            <span style={{ fontWeight:600,color:"#374a3e" }}>{label}</span>
                            <span style={{ fontWeight:800,color:ok?"#16a34a":"#d97706" }}>+{gain} {unit}</span>
                          </div>
                          <div style={{ height:7,background:"#f0f4f0",borderRadius:4,overflow:"hidden" }}>
                            <div style={{ width:`${Math.min((parseFloat(gain)/maxBar)*100,100)}%`,height:"100%",borderRadius:4,background:ok?"linear-gradient(90deg,#2eb872,#1a7a4a)":"linear-gradient(90deg,#fca5a5,#ef4444)",transition:"width 1s" }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ padding:"9px 12px",background:"#f0faf5",borderRadius:8,fontSize:12,color:"#1a5c35",borderLeft:"3px solid #2eb872",fontWeight:600 }}>
                      {parseFloat(wGain) > 0 && parseFloat(hGain) > 0 ? "✅ Positive growth since last visit." : "⚠️ Monitor growth closely."}
                    </div>
                  </div>
                )}

                {/* Record count badge */}
                <div style={{ background:"#fff",borderRadius:14,border:"1px solid #ddeae0",boxShadow:"0 2px 8px rgba(0,0,0,.05)",padding:"14px 16px",display:"flex",alignItems:"center",gap:14 }}>
                  <div style={{ width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#2eb872,#1a7a4a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>📊</div>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#0d1f14",lineHeight:1 }}>{chartData.length}</div>
                    <div style={{ fontSize:12,color:"#7a9e88",marginTop:2 }}>Total growth records</div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
