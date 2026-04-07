import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const DEFAULT_CENTER = [30.0668, 79.0193];

const hashString = (value = '') => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const getBlockCoordinates = (block, district, index) => {
  const hash = hashString(`${district || ''}|${block || ''}|${index}`);
  const latOffset = (((hash % 1000) / 1000) - 0.5) * 0.5;
  const lngOffset = ((((Math.floor(hash / 1000)) % 1000) / 1000) - 0.5) * 0.7;
  return [DEFAULT_CENTER[0] + latOffset, DEFAULT_CENTER[1] + lngOffset];
};

const FitMapToBlocks = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) {
      map.setView(DEFAULT_CENTER, 9);
      return;
    }

    if (markers.length === 1) {
      map.setView(markers[0].center, 10);
      return;
    }

    map.fitBounds(markers.map((marker) => marker.center), { padding: [36, 36] });
  }, [map, markers]);

  return null;
};

const DistrictHeatmap = () => {
  const { t } = useLanguage();
  const [blockData, setBlockData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getHeatmap()
      .then((response) => setBlockData(response.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getColor = (block) => {
    if (!block) return '#28a745';
    const ratio = (block.severe + block.moderate * 0.5) / (block.total || 1);
    if (ratio > 0.3) return '#dc3545';
    if (ratio > 0.1) return '#ffc107';
    return '#28a745';
  };

  const mapMarkers = useMemo(() => (
    blockData.map((block, index) => {
      const blockName = block._id?.block || 'Unknown';
      const districtName = block._id?.district || 'Unknown';
      const total = block.total || 0;
      const atRisk = block.severe + block.moderate;
      const pct = total ? Math.round((atRisk / total) * 100) : 0;

      return {
        ...block,
        blockName,
        districtName,
        pct,
        center: getBlockCoordinates(blockName, districtName, index),
      };
    })
  ), [blockData]);

  return (
    <Layout role="admin">
      <h4 className="fw-bold mb-4"><i className="bi bi-map-fill me-2 text-danger"></i>{t('districtHeatmap')}</h4>

      <div className="row g-3 mb-3">
        <div className="col-md-8">
          <div className="d-flex gap-3 flex-wrap">
            {[{ c: '#28a745', l: 'Healthy (<10% at risk)' }, { c: '#ffc107', l: 'At Risk (10-30%)' }, { c: '#dc3545', l: 'Critical (>30% at risk)' }].map((item) => (
              <div key={item.l} className="d-flex align-items-center gap-2">
                <div style={{ width: 18, height: 18, background: item.c, borderRadius: 4 }}></div>
                <span className="small">{item.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-danger"></div>
          <p className="mt-2 text-muted">{t('loading')}...</p>
        </div>
      ) : (
        <>
          <div className="card border-0 shadow-sm mb-4" style={{ height: 460, overflow: 'hidden', borderRadius: 12 }}>
            <MapContainer center={DEFAULT_CENTER} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              <FitMapToBlocks markers={mapMarkers} />
              {mapMarkers.map((block) => (
                <CircleMarker
                  key={`${block.districtName}-${block.blockName}`}
                  center={block.center}
                  radius={Math.max(12, Math.min(30, 10 + block.pct / 2))}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: getColor(block), fillOpacity: 0.8 }}
                >
                  <Popup>
                    <strong>{block.blockName}</strong><br />
                    District: {block.districtName}<br />
                    Total children: {block.total}<br />
                    Moderate: {block.moderate}<br />
                    Severe: {block.severe}<br />
                    At risk: {block.pct}%
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 fw-semibold">Block-wise Summary Table</div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead><tr><th>{t('block')}</th><th>{t('totalChildren')}</th><th>{t('moderate')}</th><th>{t('severe')}</th><th>At Risk %</th><th>{t('status')}</th></tr></thead>
                <tbody>
                  {mapMarkers.map((block, index) => (
                    <tr key={index}>
                      <td>{block.blockName}</td>
                      <td>{block.total}</td>
                      <td><span className="badge bg-warning text-dark">{block.moderate}</span></td>
                      <td><span className="badge bg-danger">{block.severe}</span></td>
                      <td>{block.pct}%</td>
                      <td style={{ color: getColor(block), fontWeight: 'bold' }}>{block.pct > 30 ? 'Critical' : block.pct > 10 ? 'At Risk' : t('healthy')}</td>
                    </tr>
                  ))}
                  {blockData.length === 0 && <tr><td colSpan={6} className="text-muted text-center py-4">{t('noData')}</td></tr>}
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
