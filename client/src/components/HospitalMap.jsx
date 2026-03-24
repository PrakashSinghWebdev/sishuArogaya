import { useEffect, useRef, useState } from 'react';

// Leaflet CSS must be imported once globally — done in ChatBotWidget
let L = null;

const SATELLITE_TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS_TILE    = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

function buildOverpassQuery(bounds) {
  const { south, west, north, east } = bounds;
  return `[out:json][timeout:20];
(
  node["amenity"~"^(hospital|clinic|pharmacy|health_post|doctors)$"](${south},${west},${north},${east});
  way["amenity"~"^(hospital|clinic|pharmacy|health_post|doctors)$"](${south},${west},${north},${east});
);
out center 200;`;
}

const ICON_COLOR = {
  hospital:    '#ef4444',
  clinic:      '#0891b2',
  pharmacy:    '#059669',
  health_post: '#f59e0b',
  doctors:     '#7c3aed',
};

const ICON_EMOJI = {
  hospital:    '🏥',
  clinic:      '🏥',
  pharmacy:    '💊',
  health_post: '🏠',
  doctors:     '👨‍⚕️',
};

export default function HospitalMap({ height = '100%' }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layerRef     = useRef(null);
  const [status, setStatus]     = useState('init'); // init | loading | done | error
  const [count,  setCount]      = useState(0);
  const abortRef = useRef(null);

  /* ── init Leaflet map ── */
  useEffect(() => {
    if (mapRef.current) return; // already initialised

    import('leaflet').then((mod) => {
      L = mod.default || mod;

      // Fix default icon paths (Vite / bundler issue)
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, {
        center: [20.5937, 78.9629], // India centre
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
      });

      // Satellite layer
      L.tileLayer(SATELLITE_TILE, {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
      }).addTo(map);

      // Labels overlay
      L.tileLayer(LABELS_TILE, {
        attribution: '',
        maxZoom: 19,
        opacity: 0.85,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current   = map;

      // Load hospitals when user stops moving the map
      map.on('moveend', () => loadHospitals(map));

      // Initial load after a brief delay
      setTimeout(() => loadHospitals(map), 600);
    });

    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line

  /* ── fetch hospitals from Overpass API ── */
  async function loadHospitals(map) {
    if (!map || !L) return;
    const zoom = map.getZoom();
    if (zoom < 9) {
      // Too zoomed out — skip fetch, clear markers
      if (layerRef.current) layerRef.current.clearLayers();
      setStatus('zoom');
      return;
    }

    const b = map.getBounds();
    const bounds = {
      south: b.getSouth().toFixed(4),
      west:  b.getWest().toFixed(4),
      north: b.getNorth().toFixed(4),
      east:  b.getEast().toFixed(4),
    };

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setStatus('loading');
    try {
      const body = buildOverpassQuery(bounds);
      const resp = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body,
        signal: abortRef.current.signal,
      });
      if (!resp.ok) throw new Error('Overpass error');
      const data = await resp.json();

      if (layerRef.current) layerRef.current.clearLayers();

      let added = 0;
      (data.elements || []).forEach((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (!lat || !lng) return;

        const tags    = el.tags || {};
        const amenity = tags.amenity || 'hospital';
        const name    = tags.name || tags['name:en'] || 'Health Facility';
        const addr    = [tags['addr:full'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ');
        const phone   = tags.phone || tags['contact:phone'] || '';
        const color   = ICON_COLOR[amenity] || '#0891b2';
        const emoji   = ICON_EMOJI[amenity] || '🏥';

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:${color};border:2.5px solid #fff;
            display:flex;align-items:center;justify-content:center;
            font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.35);
            cursor:pointer;
          ">${emoji}</div>`,
          iconSize:   [28, 28],
          iconAnchor: [14, 14],
        });

        const popup = `
          <div style="font-family:'DM Sans',sans-serif;min-width:180px;max-width:260px">
            <div style="font-weight:700;font-size:13px;color:#0c2340;margin-bottom:4px">${emoji} ${name}</div>
            <div style="font-size:11px;color:#0891b2;font-weight:600;margin-bottom:6px;text-transform:capitalize">${amenity.replace('_',' ')}</div>
            ${addr ? `<div style="font-size:11px;color:#4a7a8a;margin-bottom:3px">📍 ${addr}</div>` : ''}
            ${phone ? `<a href="tel:${phone}" style="font-size:11px;color:#059669;font-weight:600;text-decoration:none">📞 ${phone}</a>` : ''}
          </div>`;

        L.marker([lat, lng], { icon })
          .bindPopup(popup, { maxWidth: 280 })
          .addTo(layerRef.current);
        added++;
      });

      setCount(added);
      setStatus('done');
    } catch (err) {
      if (err.name !== 'AbortError') setStatus('error');
    }
  }

  /* ── geolocate user ── */
  function locateUser() {
    if (!mapRef.current) return;
    mapRef.current.locate({ setView: true, maxZoom: 13 });
    mapRef.current.once('locationfound', (e) => {
      L.marker(e.latlng, {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.25)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7],
        }),
      }).bindPopup('📍 Your location').addTo(mapRef.current).openPopup();
    });
  }

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      {/* Map container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 12 }} />

      {/* Status bar */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, background: 'rgba(12,35,64,.82)', color: '#cffafe',
        borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 600,
        backdropFilter: 'blur(4px)', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {status === 'loading' && <><SpinDot /> Loading hospitals…</>}
        {status === 'done'    && <>🏥 {count} health facilities near you</>}
        {status === 'zoom'    && <>🔍 Zoom in to see hospitals</>}
        {status === 'error'   && <>⚠️ Map data unavailable — try again</>}
        {status === 'init'    && <>🗺️ India Health Facilities Map</>}
      </div>

      {/* Locate me button */}
      <button
        onClick={locateUser}
        title="Find my location"
        style={{
          position: 'absolute', bottom: 80, right: 10, zIndex: 1000,
          width: 36, height: 36, borderRadius: '50%',
          background: '#fff', border: '2px solid #c5e8ef',
          fontSize: 16, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,.2)',
        }}
      >📍</button>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10, zIndex: 1000,
        background: 'rgba(12,35,64,.85)', borderRadius: 10,
        padding: '8px 12px', backdropFilter: 'blur(4px)',
      }}>
        {Object.entries(ICON_EMOJI).map(([type, emoji]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 11 }}>{emoji}</span>
            <span style={{ fontSize: 10, color: '#cffafe', textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ICON_COLOR[type], marginLeft: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SpinDot() {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10,
      border: '2px solid rgba(207,250,254,.4)', borderTopColor: '#cffafe',
      borderRadius: '50%', animation: 'spin .7s linear infinite',
    }} />
  );
}
