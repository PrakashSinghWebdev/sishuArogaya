import { useEffect, useRef, useState, useCallback } from 'react';

let L = null;

const SATELLITE_TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS_TILE    = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const NOMINATIM      = 'https://nominatim.openstreetmap.org/search';
const OSRM_ROUTE     = 'https://router.project-osrm.org/route/v1/driving';

const AMENITY_CFG = {
  hospital:    { color: '#ef4444', emoji: '🏥', label: 'Hospital' },
  clinic:      { color: '#0891b2', emoji: '🏥', label: 'Clinic' },
  pharmacy:    { color: '#059669', emoji: '💊', label: 'Pharmacy' },
  health_post: { color: '#f59e0b', emoji: '🏠', label: 'Health Post' },
  doctors:     { color: '#7c3aed', emoji: '👨‍⚕️', label: 'Doctor' },
};

function buildOverpassQuery(bounds) {
  const { south, west, north, east } = bounds;
  return `[out:json][timeout:25];(node["amenity"~"^(hospital|clinic|pharmacy|health_post|doctors)$"](${south},${west},${north},${east});way["amenity"~"^(hospital|clinic|pharmacy|health_post|doctors)$"](${south},${west},${north},${east}););out center 300;`;
}

function makeIcon(amenity) {
  const cfg = AMENITY_CFG[amenity] || AMENITY_CFG.hospital;
  const svg = `<div style="width:32px;height:32px;border-radius:50%;background:${cfg.color};border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.35)">${cfg.emoji}</div>`;
  return L.divIcon({ html: svg, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
}

function makeUserIcon() {
  const svg = `<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.3)"></div>`;
  return L.divIcon({ html: svg, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
}

export default function HospitalMap({ height = '100%', showSearchBar = true }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layerRef     = useRef(null);
  const routeRef     = useRef(null);
  const userMarkerRef = useRef(null);
  const abortRef     = useRef(null);

  const [status,       setStatus]       = useState('idle');
  const [count,        setCount]        = useState(0);
  const [userPos,      setUserPos]      = useState(null);
  const [searchText,   setSearchText]   = useState('');
  const [searching,    setSearching]    = useState(false);
  const [searchError,  setSearchError]  = useState('');
  const [routeInfo,    setRouteInfo]    = useState(null); // { km, mins, name }

  /* ── Load Leaflet CSS once ── */
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  /* ── Fetch hospitals in current viewport ── */
  const fetchHospitals = useCallback(async (map) => {
    if (map.getZoom() < 10) {
      setStatus('zoom');
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setStatus('loading');

    const b = map.getBounds();
    const query = buildOverpassQuery({
      south: b.getSouth(), west: b.getWest(),
      north: b.getNorth(), east: b.getEast(),
    });

    try {
      const resp = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        signal: abortRef.current.signal,
      });
      const data = await resp.json();
      layerRef.current.clearLayers();

      const elements = data.elements || [];
      elements.forEach((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (!lat || !lng) return;

        const amenity = el.tags?.amenity || 'hospital';
        const cfg = AMENITY_CFG[amenity] || AMENITY_CFG.hospital;
        const name = el.tags?.name || `${cfg.label} (unnamed)`;
        const addr = [el.tags?.['addr:full'], el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ');
        const phone = el.tags?.phone || el.tags?.['contact:phone'] || '';

        const marker = L.marker([lat, lng], { icon: makeIcon(amenity) });
        marker._hospitalData = { lat, lng, name, amenity, cfg };
        marker.bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;min-width:200px;max-width:260px">
            <div style="font-weight:700;font-size:14px;color:#0c2340;margin-bottom:4px">${cfg.emoji} ${name}</div>
            <div style="font-size:11px;color:#0891b2;font-weight:600;margin-bottom:6px">${cfg.label}</div>
            ${addr ? `<div style="font-size:12px;color:#4a7a8a;margin-bottom:4px">📍 ${addr}</div>` : ''}
            ${phone ? `<div style="font-size:12px;margin-bottom:8px">📞 <a href="tel:${phone}" style="color:#059669">${phone}</a></div>` : ''}
            <button id="route-btn-${el.id}" style="background:#0891b2;color:#fff;border:none;border-radius:7px;padding:6px 12px;font-size:12px;cursor:pointer;font-weight:600;width:100%">
              🗺️ Get Directions
            </button>
          </div>
        `);

        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.getElementById(`route-btn-${el.id}`);
            if (btn) btn.onclick = () => getRoute(lat, lng, name);
          }, 100);
        });

        layerRef.current.addLayer(marker);
      });

      setCount(elements.length);
      setStatus('done');
    } catch (err) {
      if (err.name !== 'AbortError') setStatus('error');
    }
  }, []);

  /* ── Draw route using OSRM ── */
  const getRoute = useCallback(async (destLat, destLng, name) => {
    if (!userPos) {
      alert('Please enable GPS first (📍 button) to get directions.');
      return;
    }
    if (routeRef.current) {
      mapRef.current.removeLayer(routeRef.current);
      routeRef.current = null;
    }

    try {
      const url = `${OSRM_ROUTE}/${userPos.lng},${userPos.lat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (!data.routes?.length) { alert('Could not calculate route.'); return; }

      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const km = (route.distance / 1000).toFixed(1);
      const mins = Math.round(route.duration / 60);

      routeRef.current = L.polyline(coords, {
        color: '#2563eb', weight: 5, opacity: 0.85, dashArray: null,
      }).addTo(mapRef.current);

      mapRef.current.fitBounds(routeRef.current.getBounds(), { padding: [40, 40] });
      setRouteInfo({ km, mins, name });
    } catch {
      alert('Could not load route. Please check your connection.');
    }
  }, [userPos]);

  /* ── GPS locate ── */
  const locateUser = useCallback(() => {
    if (!mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setUserPos({ lat, lng });
        mapRef.current.setView([lat, lng], 14);

        if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = L.marker([lat, lng], { icon: makeUserIcon() })
          .addTo(mapRef.current)
          .bindPopup('<b>📍 You are here</b>').openPopup();
      },
      () => alert('Could not get your location. Please allow location access in your browser.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /* ── Search location (Nominatim) ── */
  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!searchText.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const url = `${NOMINATIM}?q=${encodeURIComponent(searchText + ', India')}&format=json&limit=1`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const results = await resp.json();
      if (!results.length) { setSearchError('Location not found. Try a different name.'); return; }
      const { lat, lon, display_name } = results[0];
      mapRef.current.setView([+lat, +lon], 14);
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [searchText]);

  /* ── Init Leaflet map ── */
  useEffect(() => {
    if (mapRef.current) return;

    import('leaflet').then((mod) => {
      L = mod.default || mod;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer(SATELLITE_TILE, { attribution: 'Tiles © Esri', maxZoom: 19 }).addTo(map);
      L.tileLayer(LABELS_TILE, { attribution: '', maxZoom: 19, opacity: 0.85 }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current   = map;

      // Auto-geolocate on load
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const { latitude: lat, longitude: lng } = coords;
            setUserPos({ lat, lng });
            map.setView([lat, lng], 13);
            userMarkerRef.current = L.marker([lat, lng], { icon: makeUserIcon() })
              .addTo(map)
              .bindPopup('<b>📍 You are here</b>');
          },
          () => {} // silently skip if denied
        );
      }

      map.on('moveend', () => fetchHospitals(map));
    });

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchHospitals]);

  const clearRoute = () => {
    if (routeRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeRef.current);
      routeRef.current = null;
    }
    setRouteInfo(null);
  };

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 12, overflow: 'hidden' }}>

      {/* ── Search + Controls bar ── */}
      {showSearchBar && (
        <div style={{ padding: '8px 10px', background: '#0c2340', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 6 }}>
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search city, village, area…"
              style={{
                flex: 1, padding: '7px 12px', borderRadius: 8,
                border: '1.5px solid rgba(255,255,255,.2)',
                background: 'rgba(255,255,255,.1)', color: '#fff',
                fontSize: 12, outline: 'none',
                '::placeholder': { color: 'rgba(255,255,255,.5)' },
              }}
            />
            <button
              type="submit"
              disabled={searching}
              style={{
                background: '#0891b2', color: '#fff', border: 'none',
                borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
              }}
            >
              {searching ? '…' : '🔍'}
            </button>
          </form>
          <button
            onClick={locateUser}
            title="Use my GPS location"
            style={{
              background: userPos ? '#059669' : 'rgba(255,255,255,.15)',
              color: '#fff', border: '1.5px solid rgba(255,255,255,.3)',
              borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: 14,
            }}
          >📍</button>
        </div>
      )}
      {searchError && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', fontSize: 11, textAlign: 'center' }}>
          {searchError}
        </div>
      )}

      {/* ── Route info banner ── */}
      {routeInfo && (
        <div style={{
          background: '#2563eb', color: '#fff', padding: '6px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, fontWeight: 600, flexShrink: 0,
        }}>
          <span>🗺️ {routeInfo.name} — {routeInfo.km} km · ~{routeInfo.mins} min drive</span>
          <button onClick={clearRoute} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 6, color: '#fff', padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>✕ Clear</button>
        </div>
      )}

      {/* ── Map container ── */}
      <div ref={containerRef} style={{ flex: 1 }} />

      {/* ── Status bar ── */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(12,35,64,.8)', color: '#cffafe', backdropFilter: 'blur(4px)',
        borderRadius: 20, padding: '4px 14px', fontSize: 11, pointerEvents: 'none', zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {status === 'loading' && <><span style={{ width: 10, height: 10, border: '2px solid #cffafe', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Loading…</>}
        {status === 'done' && `✅ ${count} facilities found`}
        {status === 'zoom' && '🔍 Zoom in to see hospitals'}
        {status === 'error' && '⚠️ Could not load data'}
        {status === 'idle' && '🗺️ Move map to load hospitals'}
      </div>

      {/* ── Legend ── */}
      <div style={{
        position: 'absolute', top: showSearchBar ? 96 : 8, right: 8,
        background: 'rgba(12,35,64,.85)', backdropFilter: 'blur(4px)',
        borderRadius: 10, padding: '8px 12px', zIndex: 1000,
      }}>
        {Object.entries(AMENITY_CFG).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#cffafe', fontSize: 11 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: v.color, display: 'inline-block', flexShrink: 0 }} />
            {v.label}
          </div>
        ))}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
