import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const DEFAULT_CENTER = [30.0668, 79.0193];

const DistrictHeatmap = () => {
  const { t } = useLanguage();
  const [blockData, setBlockData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminAPI.getHeatmap().then(r=>setBlockData(r.data)).catch(console.error).finally(()=>setLoading(false)); }, []);

  const getColor = (b) => {
    if (!b) return '#28a745';
    const ratio = (b.severe + b.moderate * 0.5) / (b.total || 1);
    if (ratio > 0.3) return '#dc3545';
    if (ratio > 0.1) return '#ffc107';
    return '#28a745';
  };

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-4"><i className="bi bi-map-fill me-2 text-danger"></i>{t('districtHeatmap')}</h4>
      <div className="row g-3 mb-3">
        <div className="col-md-8">
          <div className="d-flex gap-3 flex-wrap">
            {[{c:'#28a745',l:'Healthy (&lt;10% at risk)'},{c:'#ffc107',l:'At Risk (10–30%)'},{c:'#dc3545',l:'Critical (&gt;30% at risk)'}].map(b=>(
              <div key={b.l} className="d-flex align-items-center gap-2"><div style={{width:18,height:18,background:b.c,borderRadius:4}}></div><span className="small"  dangerouslySetInnerHTML={{__html:b.l}}></span></div>
            ))}
          </div>
        </div>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border text-danger"></div><p className="mt-2 text-muted">{t('loading')}...</p></div> : (
        <>
          <div className="card border-0 shadow-sm mb-4" style={{height:460,overflow:'hidden',borderRadius:12}}>
            <MapContainer center={DEFAULT_CENTER} zoom={9} style={{height:'100%',width:'100%'}}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            </MapContainer>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">Block-wise Summary Table</div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead><tr><th>{t('block')}</th><th>{t('totalChildren')}</th><th>{t('moderate')}</th><th>{t('severe')}</th><th>At Risk %</th><th>{t('status')}</th></tr></thead>
                <tbody>
                  {blockData.map((b,i)=>{
                    const total = b.total||1;
                    const pct = Math.round(((b.severe+b.moderate)/total)*100);
                    return <tr key={i}><td>{b._id?.block||'Unknown'}</td><td>{b.total}</td><td><span className="badge bg-warning text-dark">{b.moderate}</span></td><td><span className="badge bg-danger">{b.severe}</span></td><td>{pct}%</td><td style={{color:getColor(b),fontWeight:'bold'}}>{pct>30?'Critical':pct>10?'At Risk':t('healthy')}</td></tr>;
                  })}
                  {blockData.length===0&&<tr><td colSpan={6} className="text-muted text-center py-4">{t('noData')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default DistrictHeatmap;
