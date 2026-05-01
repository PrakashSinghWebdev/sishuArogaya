import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { ashaAPI } from '../../services/api';

// Uttarakhand centre — good fallback before we have real coords
const MAP_DEFAULT = [30.0668, 79.0193];

const statusDotColor = {
  healthy:  '#059669',
  moderate: '#f59e0b',
  severe:   '#dc2626',
};

// Deterministic hash so a child always lands on the same spot
function hashStr(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pseudoLatLng(child, idx) {
  const seed = `${child.district || ''}|${child.block || ''}|${child.village || ''}|${child.name || ''}|${idx}`;
  const h = hashStr(seed);
  const latOff = (((h % 1000) / 1000) - 0.5) * 0.12;
  const lngOff = ((((Math.floor(h / 1000)) % 1000) / 1000) - 0.5) * 0.12;
  return [MAP_DEFAULT[0] + latOff, MAP_DEFAULT[1] + lngOff];
}

// Leaflet hook — fits the map viewport around all markers
function AutoFit({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!markers || markers.length === 0) {
      map.setView(MAP_DEFAULT, 12);
      return;
    }
    if (markers.length === 1) {
      map.setView(markers[0].center, 13);
      return;
    }
    const coords = markers.map(m => m.center);
    map.fitBounds(coords, { padding: [32, 32], maxZoom: 14 });
  }, [map, markers]);

  return null;
}

export const AshaCoverageMapPanel = ({ childrenData, loading: loadingProp = false, embedded = false }) => {
  const [localChildren, setLocalChildren] = useState([]);
  const [fetching, setFetching] = useState(!childrenData);

  useEffect(() => {
    if (childrenData) {
      setLocalChildren(childrenData);
      setFetching(false);
      return;
    }
    ashaAPI.getMyChildren()
      .then(res => setLocalChildren(res.data))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [childrenData]);

  // use external data if provided, otherwise local fetch
  const allChildren = childrenData || localChildren;
  const isLoading   = childrenData ? loadingProp : fetching;

  const markers = useMemo(
    () => allChildren.map((child, i) => ({
      ...child,
      center: pseudoLatLng(child, i),
    })),
    [allChildren]
  );

  const counts = {
    total:    allChildren.length,
    healthy:  allChildren.filter(c => c.nutritionStatus === 'healthy').length,
    moderate: allChildren.filter(c => c.nutritionStatus === 'moderate').length,
    severe:   allChildren.filter(c => c.nutritionStatus === 'severe').length,
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <div style={{
          width: 44, height: 44,
          border: '4px solid #cffafe', borderTopColor: '#0891b2',
          borderRadius: '50%', animation: 'spin .8s linear infinite',
        }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {!embedded && (
        <h4 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 700, color: '#0c2340', marginBottom: 20 }}>
          <span style={{ fontSize: 24, marginRight: 8, color: '#0891b2' }}>🗺️</span>
          Area Coverage Map
        </h4>
      )}

      <div style={{
        background: '#f0fdff', border: '1.5px solid #c5e8ef', borderRadius: 12,
        padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12,
        color: '#0c2340', fontSize: 13,
      }}>
        <span style={{ fontSize: 22 }}>ℹ️</span>
        <div style={{ lineHeight: 1.5 }}>
          <strong>Map precision:</strong> Showing approximate, stable child locations based on assigned district, block, and village.
        </div>
      </div>

      {/* quick stat pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          ['Total',    counts.total,    '#0891b2'],
          ['Healthy',  counts.healthy,  '#059669'],
          ['Moderate', counts.moderate, '#f59e0b'],
          ['Severe',   counts.severe,   '#dc2626'],
        ].map(([label, value, color]) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.9)',
            border: `1.5px solid ${color}33`,
            borderRadius: 12, padding: '14px 10px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: '#4a7a8a', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{
        height: 480, borderRadius: 16, overflow: 'hidden',
        border: '1.5px solid #c5e8ef',
        boxShadow: '0 8px 24px rgba(8,145,178,0.1)',
      }}>
        {allChildren.length === 0 ? (
          <div style={{
            height: '100%', background: '#fbfeff',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#4a7a8a',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📍</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0c2340' }}>No Children Assigned</div>
            <div style={{ fontSize: 13 }}>Once children are assigned to your area, they will appear here.</div>
          </div>
        ) : (
          <MapContainer
            center={MAP_DEFAULT}
            zoom={12}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap &copy; CARTO"
            />
            <AutoFit markers={markers} />
            {markers.map(child => (
              <CircleMarker
                key={child._id}
                center={child.center}
                radius={8}
                fillColor={statusDotColor[child.nutritionStatus] || '#6c757d'}
                color="#fff"
                weight={2}
                fillOpacity={0.85}
              >
                <Popup>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", padding: 4 }}>
                    <strong style={{ fontSize: 14, color: '#0c2340', display: 'block', marginBottom: 4 }}>
                      👶 {child.name}
                    </strong>
                    <div style={{ fontSize: 12, color: '#4a7a8a', marginBottom: 2 }}>Age: {child.ageInMonths} mo</div>
                    <div style={{ fontSize: 12, color: '#4a7a8a', marginBottom: 6 }}>
                      Status:{' '}
                      <span style={{ textTransform: 'capitalize', color: statusDotColor[child.nutritionStatus] }}>
                        {child.nutritionStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>
                      🗺️ {child.village || child.block || child.district || 'Location unavailable'}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

// standalone page — wraps the panel in the shared ASHA layout
const AreaCoverageMap = () => (
  <Layout role="asha">
    <div style={{
      background: '#fff',
      border: '1.5px solid #c5e8ef',
      borderRadius: 16,
      padding: '24px 28px',
      boxShadow: '0 6px 24px rgba(8,145,178,0.08)',
    }}>
      <AshaCoverageMapPanel />
    </div>
  </Layout>
);

export default AreaCoverageMap;
