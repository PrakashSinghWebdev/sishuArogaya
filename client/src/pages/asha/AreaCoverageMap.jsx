import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { ashaAPI } from '../../services/api';

const STATUS_COLOR = { healthy: '#28a745', moderate: '#ffc107', severe: '#dc3545' };
const DEFAULT_CENTER = [30.0668, 79.0193];

const hashString = (value = '') => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const getPseudoCoordinates = (child, index) => {
  const seed = `${child.district || ''}|${child.block || ''}|${child.village || ''}|${child.name || ''}|${index}`;
  const hash = hashString(seed);
  const latOffset = (((hash % 1000) / 1000) - 0.5) * 0.12;
  const lngOffset = ((((Math.floor(hash / 1000)) % 1000) / 1000) - 0.5) * 0.12;
  return [DEFAULT_CENTER[0] + latOffset, DEFAULT_CENTER[1] + lngOffset];
};

const FitMapToMarkers = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) {
      map.setView(DEFAULT_CENTER, 12);
      return;
    }

    if (markers.length === 1) {
      map.setView(markers[0].center, 13);
      return;
    }

    map.fitBounds(markers.map((marker) => marker.center), { padding: [32, 32] });
  }, [map, markers]);

  return null;
};

const AreaCoverageMap = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ashaAPI.getMyChildren()
      .then((response) => setChildren(response.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const childMarkers = useMemo(() => (
    children.map((child, index) => {
      const [lat, lng] = getPseudoCoordinates(child, index);
      return { ...child, center: [lat, lng] };
    })
  ), [children]);

  return (
    <Layout role="asha">
      <h4 className="fw-bold mb-4"><i className="bi bi-map me-2 text-success"></i>Area Coverage Map</h4>
      <div className="alert alert-info border-0 mb-3 small">
        <i className="bi bi-info-circle me-2"></i>
        Map shows approximate, stable child locations based on assigned district, block, and village.
      </div>

      <div className="row g-3 mb-3">
        {[{ l: 'Total', v: children.length, c: 'bg-primary' }, { l: 'Healthy', v: children.filter((c) => c.nutritionStatus === 'healthy').length, c: 'bg-success' }, { l: 'Moderate', v: children.filter((c) => c.nutritionStatus === 'moderate').length, c: 'bg-warning text-dark' }, { l: 'Severe', v: children.filter((c) => c.nutritionStatus === 'severe').length, c: 'bg-danger' }].map((s) => (
          <div className="col-3" key={s.l}>
            <div className={`card border-0 p-2 text-center text-white ${s.c}`}>
              <div className="fw-bold fs-4">{s.v}</div>
              <div className="small">{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ height: 460, overflow: 'hidden', borderRadius: 12 }}>
          <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <FitMapToMarkers markers={childMarkers} />
            {childMarkers.map((child) => (
              <CircleMarker
                key={child._id}
                center={child.center}
                radius={8}
                fillColor={STATUS_COLOR[child.nutritionStatus] || '#6c757d'}
                color="#fff"
                weight={2}
                fillOpacity={0.85}
              >
                <Popup>
                  <strong>{child.name}</strong><br />
                  {child.ageInMonths} mo - {child.nutritionStatus}<br />
                  {child.village || child.block || child.district || 'Location unavailable'}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </Layout>
  );
};

export default AreaCoverageMap;
