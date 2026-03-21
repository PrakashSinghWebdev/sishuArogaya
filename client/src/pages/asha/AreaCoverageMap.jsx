import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { ashaAPI } from '../../services/api';

const STATUS_COLOR = { healthy: '#28a745', moderate: '#ffc107', severe: '#dc3545' };

// Approximate Uttarakhand coordinates for demo; in production use real child coordinates
const DEFAULT_CENTER = [30.0668, 79.0193];

const AreaCoverageMap = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { ashaAPI.getMyChildren().then(r=>setChildren(r.data)).catch(console.error).finally(()=>setLoading(false)); }, []);

  // Demo: scatter children around a central point (replace with real lat/lng in production)
  const childMarkers = children.map((c, i) => ({
    ...c,
    lat: DEFAULT_CENTER[0] + (Math.random()-0.5)*0.1,
    lng: DEFAULT_CENTER[1] + (Math.random()-0.5)*0.1,
  }));

  return (
    <Layout role="asha">
      <h4 className="fw-bold mb-4"><i className="bi bi-map me-2 text-success"></i>Area Coverage Map</h4>
      <div className="alert alert-info border-0 mb-3 small">
        <i className="bi bi-info-circle me-2"></i>Map shows approximate child locations in your coverage area. Green = Healthy, Yellow = Moderate, Red = Severe.
      </div>
      <div className="row g-3 mb-3">
        {[{l:'Total',v:children.length,c:'bg-primary'},{l:'Healthy',v:children.filter(c=>c.nutritionStatus==='healthy').length,c:'bg-success'},{l:'Moderate',v:children.filter(c=>c.nutritionStatus==='moderate').length,c:'bg-warning text-dark'},{l:'Severe',v:children.filter(c=>c.nutritionStatus==='severe').length,c:'bg-danger'}].map(s=>(
          <div className="col-3" key={s.l}><div className={`card border-0 p-2 text-center text-white ${s.c}`}><div className="fw-bold fs-4">{s.v}</div><div className="small">{s.l}</div></div></div>
        ))}
      </div>
      {loading ? <div className="text-center py-5"><div className="spinner-border text-success"></div></div> : (
        <div className="card border-0 shadow-sm" style={{height:460,overflow:'hidden',borderRadius:12}}>
          <MapContainer center={DEFAULT_CENTER} zoom={12} style={{height:'100%',width:'100%'}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            {childMarkers.map((c,i)=>(
              <CircleMarker key={i} center={[c.lat,c.lng]} radius={8} fillColor={STATUS_COLOR[c.nutritionStatus]||'#6c757d'} color="#fff" weight={2} fillOpacity={0.85}>
                <Popup><strong>{c.name}</strong><br/>{c.ageInMonths}mo · {c.nutritionStatus}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </Layout>
  );
};

export default AreaCoverageMap;
