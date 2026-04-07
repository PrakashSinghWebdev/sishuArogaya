/**
 * HospitalMap.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Key fixes over previous version:
 *  1. selectedId removed from marker-rebuild effect → popups no longer self-close
 *  2. drawRoute stored in a ref → no stale-closure dep issues
 *  3. Single watchPosition (no duplicate getCurrentPosition race)
 *  4. Hospitals shown immediately from static data while GPS resolves
 *  5. Markers added incrementally (no full clear on every update)
 *  6. Geolocation error codes surfaced clearly to user
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hospitalAPI } from '../services/api';

/* ── global Leaflet handle (lazy-loaded) ─────────────── */
let L = null;

/* ── constants ───────────────────────────────────────── */
const SATELLITE_TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS_TILE    = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const NOMINATIM      = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_EPS   = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];
const OSRM           = 'https://router.project-osrm.org/route/v1/driving';
const RADIUS_M       = 30_000; // 30 km in metres

/* ── amenity config ──────────────────────────────────── */
const A = {
  hospital:    { color:'#dc2626', label:'Hospital',    letter:'H',  emoji:'🏥' },
  clinic:      { color:'#0891b2', label:'Clinic',      letter:'+',  emoji:'🏨' },
  pharmacy:    { color:'#059669', label:'Pharmacy',    letter:'Rx', emoji:'💊' },
  health_post: { color:'#d97706', label:'Health Post', letter:'HP', emoji:'🏠' },
  doctors:     { color:'#7c3aed', label:'Doctor',      letter:'Dr', emoji:'👨‍⚕️' },
};

const FILTER_TABS = [
  { key:'all',       label:'All',        emoji:'📍' },
  { key:'hospital',  label:'Hospitals',  emoji:'🏥' },
  { key:'clinic',    label:'Clinics',    emoji:'🏨' },
  { key:'pharmacy',  label:'Pharmacies', emoji:'💊' },
];

/* ── static fallback data ────────────────────────────── */
const STATIC = [
  { id:'s01', lat:28.6362, lng:77.2166, type:'hospital', name:'AIIMS New Delhi',            address:'Ansari Nagar, New Delhi',    phone:'011-26588500', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s02', lat:28.6517, lng:77.2219, type:'hospital', name:'Safdarjung Hospital',         address:'Ring Road, New Delhi',       phone:'011-26730000', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s03', lat:19.0176, lng:72.8561, type:'hospital', name:'KEM Hospital Mumbai',         address:'Parel, Mumbai',              phone:'022-24107000', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s04', lat:13.0102, lng:80.2356, type:'hospital', name:'Govt General Hospital',       address:'Park Town, Chennai',         phone:'044-25305000', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s05', lat:22.5726, lng:88.3639, type:'hospital', name:'SSKM Hospital Kolkata',       address:'AJC Bose Road, Kolkata',     phone:'033-22041739', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s06', lat:17.3850, lng:78.4867, type:'hospital', name:'Osmania General Hyderabad',   address:'Afzalgunj, Hyderabad',       phone:'040-24600124', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s07', lat:12.9716, lng:77.5946, type:'hospital', name:'Victoria Hospital Bengaluru', address:'Fort Road, Bengaluru',       phone:'080-26700000', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s08', lat:26.8467, lng:80.9462, type:'hospital', name:'KGMU Lucknow',               address:'Shah Mina Road, Lucknow',    phone:'0522-2257450', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s09', lat:23.0225, lng:72.5714, type:'hospital', name:'Civil Hospital Ahmedabad',    address:'Asarwa, Ahmedabad',          phone:'079-22680058', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s10', lat:18.5204, lng:73.8567, type:'hospital', name:'Sassoon General Pune',        address:'Dhanraj Nana Chowk, Pune',  phone:'020-26128000', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s11', lat:25.5941, lng:85.1376, type:'hospital', name:'PMCH Patna',                  address:'Ashok Rajpath, Patna',       phone:'0612-2300016', isGovernment:true,  hasEmergency:true,  hasICU:false },
  { id:'s12', lat:26.9124, lng:75.8235, type:'hospital', name:'SMS Medical College Jaipur',  address:'JLN Marg, Jaipur',           phone:'0141-2518501', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s13', lat:30.0869, lng:78.2650, type:'hospital', name:'AIIMS Rishikesh',             address:'Virbhadra Rd, Rishikesh',    phone:'0135-2462916', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s14', lat:30.3165, lng:78.0338, type:'hospital', name:'Doon Govt Hospital',          address:'Sharanpur Rd, Dehradun',     phone:'0135-2714441', isGovernment:true,  hasEmergency:true,  hasICU:true  },
  { id:'s15', lat:29.9457, lng:78.1642, type:'hospital', name:'District Hospital Haridwar',  address:'Ranipur More, Haridwar',     phone:'01334-226506', isGovernment:true,  hasEmergency:true,  hasICU:false },
];

/* ── helpers ─────────────────────────────────────────── */
const toRad = x => (x * Math.PI) / 180;
function distKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function overpassQuery(lat, lng) {
  return `[out:json][timeout:25];(node["amenity"~"^(hospital|clinic|pharmacy|health_post|doctors)$"](around:${RADIUS_M},${lat},${lng});way["amenity"~"^(hospital|clinic|pharmacy|health_post|doctors)$"](around:${RADIUS_M},${lat},${lng}););out center 300;`;
}

/* ── icon factories ──────────────────────────────────── */
function facilityIcon(type, highlighted = false) {
  const cfg  = A[type] || A.hospital;
  const sz   = highlighted ? 38 : 30;
  const fs   = cfg.letter.length > 1 ? 8 : 12;
  const glow = highlighted ? 'box-shadow:0 0 0 6px rgba(220,38,38,.4);' : '';
  return L.divIcon({
    className: '',
    iconSize:    [sz+2, sz+10],
    iconAnchor:  [(sz+2)/2, sz+10],
    popupAnchor: [0, -(sz+12)],
    html: `<div style="display:flex;flex-direction:column;align-items:center;width:${sz+2}px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.6))">
      <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${cfg.color};border:2.5px solid #fff;
        display:flex;align-items:center;justify-content:center;color:#fff;font-size:${highlighted?fs+2:fs}px;
        font-weight:900;font-family:Arial,sans-serif;${glow}">${cfg.letter}</div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;
        border-top:9px solid ${cfg.color};margin-top:-1px"></div></div>`,
  });
}

function userIcon() {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="position:relative;width:28px;height:28px">
      <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(37,99,235,.18);animation:ripple 1.8s ease-out infinite"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>
    </div>`,
  });
}

/* ════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════ */
export default function HospitalMap({ height = '100%', showSearchBar = true }) {

  /* ── map refs (never cause re-renders) ── */
  const mapDivRef      = useRef(null);   // DOM container
  const mapRef         = useRef(null);   // Leaflet map instance
  const layerRef       = useRef(null);   // Leaflet LayerGroup for markers
  const circleRef      = useRef(null);   // radius circle
  const routeLineRef   = useRef(null);   // polyline
  const userMarkerRef  = useRef(null);   // user's blue dot
  const markerMapRef   = useRef({});     // id → Leaflet marker
  const watchRef       = useRef(null);   // watchPosition id
  const abortRef       = useRef(null);   // fetch AbortController
  const userPosRef     = useRef(null);   // latest {lat,lng} (sync, no re-render)
  const destRef        = useRef(null);   // active route destination
  const followRef      = useRef(true);   // auto-follow user position
  const fetchedOnceRef = useRef(false);  // prevent duplicate initial fetches
  const drawRouteRef   = useRef(null);   // ← stable ref to drawRoute fn

  /* ── ui state ── */
  const [status,        setStatus]        = useState('idle');  // idle|loading|done|fallback|zoom|error
  const [dataSource,    setDataSource]    = useState('');
  const [hospitals,     setHospitals]     = useState([]);
  const [filterType,    setFilterType]    = useState('all');
  const [selectedId,    setSelectedId]    = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showPanel,     setShowPanel]     = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);
  const [searchText,    setSearchText]    = useState('');
  const [searching,     setSearching]     = useState(false);
  const [searchError,   setSearchError]   = useState('');
  const [routeInfo,     setRouteInfo]     = useState(null);
  const [routeLoading,  setRouteLoading]  = useState(false);
  const [gpsError,      setGpsError]      = useState('');
  const [isTracking,    setIsTracking]    = useState(false);
  const [isFollowing,   setIsFollowing]   = useState(true);

  /* ── filtered + distance-sorted list ── */
  const filtered = useMemo(() => {
    const list = filterType === 'all' ? hospitals : hospitals.filter(h => h.type === filterType);
    return [...list].sort((a,b) => (a.dist ?? 99999) - (b.dist ?? 99999));
  }, [hospitals, filterType]);

  /* ══════════════════════════════════════
     HOSPITAL FETCH  (3-tier: DB → Overpass → Static)
  ════════════════════════════════════ */
  const fetchHospitals = useCallback(async (origin) => {
    if (!origin) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStatus('loading');

    /* Tier 1: backend DB */
    try {
      const res = await hospitalAPI.nearby(origin.lat, origin.lng, RADIUS_M);
      if (res.data?.hospitals?.length > 0) {
        const list = res.data.hospitals.map(h => {
          const [lng, lat] = h.location.coordinates;
          return {
            id: String(h._id), lat, lng,
            type: h.type || 'hospital',
            name: h.name, address: h.address || '', phone: h.phone || '',
            district: h.district || '', state: h.state || '',
            isGovernment: h.isGovernment ?? true,
            hasEmergency: h.hasEmergency ?? false,
            hasICU: h.hasICU ?? false,
            dist: h.distanceMeters != null ? h.distanceMeters / 1000 : distKm(origin.lat, origin.lng, lat, lng),
            src: 'db',
          };
        });
        setHospitals(list);
        setStatus('done');
        setDataSource('🗄️ Database');
        return;
      }
    } catch { /* backend down — fall through */ }

    /* Tier 2: OpenStreetMap Overpass */
    const q = overpassQuery(origin.lat, origin.lng);
    for (const ep of OVERPASS_EPS) {
      try {
        const r = await fetch(ep, { method:'POST', body:q, signal:abortRef.current.signal });
        if (!r.ok) continue;
        const json = await r.json();
        if (json.elements?.length > 0) {
          const list = json.elements.map(el => {
            const lat = el.lat ?? el.center?.lat;
            const lng = el.lon ?? el.center?.lon;
            if (!lat || !lng) return null;
            const type = el.tags?.amenity || 'hospital';
            return {
              id: String(el.id), lat, lng, type,
              name: el.tags?.name || `${A[type]?.label ?? 'Facility'} (unnamed)`,
              address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', '),
              phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
              district: '', state: '', isGovernment: false,
              hasEmergency: false, hasICU: false,
              dist: distKm(origin.lat, origin.lng, lat, lng),
              src: 'osm',
            };
          }).filter(Boolean);
          setHospitals(list);
          setStatus('done');
          setDataSource('🌐 OpenStreetMap');
          return;
        }
        break;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    /* Tier 3: Static fallback */
    const list = STATIC.map(h => ({
      ...h,
      dist: distKm(origin.lat, origin.lng, h.lat, h.lng),
      src: 'static',
    })).sort((a,b) => a.dist - b.dist);
    setHospitals(list);
    setStatus('fallback');
    setDataSource('📋 Cached');
    setGpsError('Live hospital data unavailable. Showing nearest known facilities.');
  }, []);

  /* ══════════════════════════════════════
     ROUTE DRAWING
  ════════════════════════════════════ */
  const drawRoute = useCallback(async (destLat, destLng, name, opts = {}) => {
    const origin = opts.origin || userPosRef.current;
    if (!origin || !mapRef.current || !L) {
      setGpsError('Allow location access first to get directions.');
      return;
    }
    destRef.current = { lat:destLat, lng:destLng, name };
    setRouteLoading(true);
    try {
      const url  = `${OSRM}/${origin.lng},${origin.lat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const data = await fetch(url).then(r => r.json());
      if (!data.routes?.length) { alert('Could not calculate route right now.'); return; }
      const route  = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng,lat]) => [lat,lng]);
      const km     = (route.distance / 1000).toFixed(1);
      const mins   = Math.round(route.duration / 60);
      if (routeLineRef.current) routeLineRef.current.setLatLngs(coords);
      else routeLineRef.current = L.polyline(coords, { color:'#2563eb', weight:5, opacity:.9 }).addTo(mapRef.current);
      if (opts.fitBounds !== false) mapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding:[50,50] });
      setRouteInfo({ km, mins, name });
    } catch { alert('Could not load route. Check your connection.'); }
    finally   { setRouteLoading(false); }
  }, []);

  /* store in ref so marker onclick always gets latest version without deps */
  drawRouteRef.current = drawRoute;

  /* ══════════════════════════════════════
     USER LOCATION UPDATE
  ════════════════════════════════════ */
  const updateUserPos = useCallback((lat, lng, recenter = false) => {
    if (!mapRef.current || !L) return;
    const pos = { lat, lng };
    userPosRef.current = pos;
    setGpsError('');

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([lat,lng], { icon:userIcon(), zIndexOffset:2000 })
        .bindPopup('<b>📍 Your live location</b>')
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLatLng([lat,lng]);
    }

    /* radius circle */
    if (!circleRef.current) {
      circleRef.current = L.circle([lat,lng], {
        radius: RADIUS_M,
        color:'#2563eb', fillColor:'#2563eb', fillOpacity:.05, weight:1.5, dashArray:'6 4',
      }).addTo(mapRef.current);
    } else {
      circleRef.current.setLatLng([lat,lng]);
    }

    if (recenter) mapRef.current.setView([lat,lng], Math.max(mapRef.current.getZoom(), 14));

    /* re-draw active route from new position */
    if (destRef.current) {
      const { lat:dLat, lng:dLng, name } = destRef.current;
      drawRouteRef.current(dLat, dLng, name, { origin:pos, fitBounds:false });
    }
  }, []);

  /* ══════════════════════════════════════
     LIVE LOCATION TRACKING  (single watchPosition)
  ════════════════════════════════════ */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }
    /* clear any previous watcher */
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setIsTracking(true);
    setGpsError('');

    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        const isFirst = !userPosRef.current;
        updateUserPos(pos.lat, pos.lng, followRef.current);
        setIsTracking(true);
        setIsFollowing(followRef.current);

        /* fetch hospitals on first fix or whenever following */
        if (isFirst || followRef.current) {
          if (!fetchedOnceRef.current || followRef.current) {
            fetchedOnceRef.current = true;
            fetchHospitals(pos);
          }
        }
      },
      (err) => {
        setIsTracking(false);
        setIsFollowing(false);
        /* only show error if we've never had a fix */
        if (!userPosRef.current) {
          if (err.code === 1) {
            setGpsError(
              '🔒 Location permission denied. ' +
              'Click the lock icon in your browser address bar → ' +
              'set Location to "Allow" → then tap the 📍 GPS button.'
            );
          } else if (err.code === 2) {
            setGpsError('📡 Location unavailable. Enable GPS on your device and tap 📍 GPS.');
          } else {
            setGpsError('⏱️ Location timed out. Tap 📍 GPS to try again.');
          }
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );
  }, [fetchHospitals, updateUserPos]);

  /* ── GPS button handler ── */
  const handleLocate = useCallback(() => {
    followRef.current = true;
    setIsFollowing(true);
    fetchedOnceRef.current = false; // force refresh
    startTracking();
    if (userPosRef.current && mapRef.current) {
      mapRef.current.setView([userPosRef.current.lat, userPosRef.current.lng], 15);
    }
  }, [startTracking]);

  /* ── Re-centre / Follow button ── */
  const handleFollow = useCallback(() => {
    followRef.current = true;
    setIsFollowing(true);
    if (userPosRef.current && mapRef.current) {
      mapRef.current.setView([userPosRef.current.lat, userPosRef.current.lng], Math.max(mapRef.current.getZoom(), 14));
      fetchHospitals(userPosRef.current);
    } else {
      startTracking();
    }
  }, [fetchHospitals, startTracking]);

  /* ── Emergency mode ── */
  const handleEmergency = useCallback(() => {
    const nearest = filtered.find(h => h.type === 'hospital') || filtered[0];
    if (!nearest) { alert('No hospitals found. Tap 📍 GPS first.'); return; }
    setEmergencyMode(true);
    setSelectedId(nearest.id);
    drawRouteRef.current(nearest.lat, nearest.lng, nearest.name);
    mapRef.current?.setView([nearest.lat, nearest.lng], 15);
    setTimeout(() => markerMapRef.current[nearest.id]?.openPopup(), 400);
  }, [filtered]);

  /* ── Search ── */
  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    const q = searchText.trim();
    if (!q || !mapRef.current) return;
    setSearching(true);
    setSearchError('');
    followRef.current = false;
    setIsFollowing(false);

    /* 1. try backend name search */
    try {
      const pos = userPosRef.current;
      const res = await hospitalAPI.search(q, pos?.lat, pos?.lng);
      if (res.data?.hospitals?.length > 0) {
        const list = res.data.hospitals.map(h => {
          const [lng, lat] = h.location.coordinates;
          return {
            id: String(h._id), lat, lng, type: h.type || 'hospital',
            name: h.name, address: h.address || '', phone: h.phone || '',
            district: h.district || '', state: h.state || '',
            isGovernment: h.isGovernment ?? true,
            hasEmergency: h.hasEmergency ?? false, hasICU: h.hasICU ?? false,
            dist: pos ? distKm(pos.lat, pos.lng, lat, lng) : null,
            src: 'db',
          };
        });
        setHospitals(list);
        setStatus('done');
        setDataSource('🗄️ Database');
        const f = list[0];
        mapRef.current.setView([f.lat, f.lng], 13);
        setSearching(false);
        return;
      }
    } catch { /* backend down */ }

    /* 2. Nominatim geocode */
    try {
      for (const query of [`${q}, India`, q]) {
        const url     = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&limit=1`;
        const results = await fetch(url, { headers:{ 'Accept-Language':'en' } }).then(r => r.json());
        if (results.length) {
          const center = { lat: Number(results[0].lat), lng: Number(results[0].lon) };
          mapRef.current.setView([center.lat, center.lng], 13);
          fetchHospitals(center);
          setSearching(false);
          return;
        }
      }
      setSearchError('Location not found. Try a hospital name, city, or district.');
    } catch { setSearchError('Search failed. Please try again.'); }
    finally   { setSearching(false); }
  }, [searchText, fetchHospitals]);

  /* ── Clear route ── */
  const clearRoute = useCallback(() => {
    if (routeLineRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    destRef.current = null;
    setRouteInfo(null);
    setEmergencyMode(false);
  }, []);

  /* ── Fly to hospital from list ── */
  const flyTo = useCallback((h) => {
    followRef.current = false;
    setIsFollowing(false);
    mapRef.current?.setView([h.lat, h.lng], 16);
    setTimeout(() => markerMapRef.current[h.id]?.openPopup(), 300);
    setShowPanel(false);
  }, []);

  /* ══════════════════════════════════════
     INITIALISE LEAFLET MAP  (once)
  ════════════════════════════════════ */
  useEffect(() => {
    if (mapRef.current) return;
    let dead = false;

    import('leaflet').then(mod => {
      if (dead || !mapDivRef.current) return;
      L = mod.default || mod;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapDivRef.current, { center:[20.5937, 78.9629], zoom:5, zoomControl:true });
      L.tileLayer(SATELLITE_TILE, { attribution:'Tiles © Esri', maxZoom:19 }).addTo(map);
      L.tileLayer(LABELS_TILE,    { attribution:'',              maxZoom:19, opacity:.85 }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current   = map;

      map.on('dragstart', () => { followRef.current = false; setIsFollowing(false); });
      map.on('zoomstart', () => { followRef.current = false; setIsFollowing(false); });

      /* show static data immediately so map isn't empty while GPS resolves */
      setHospitals(STATIC);
      setStatus('fallback');
      setDataSource('📋 Cached');

      /* start live tracking right away */
      startTracking();
    });

    return () => {
      dead = true;
      abortRef.current?.abort();
      if (watchRef.current !== null) navigator.geolocation?.clearWatch(watchRef.current);
      mapRef.current?.remove();
      mapRef.current = layerRef.current = circleRef.current = routeLineRef.current =
        userMarkerRef.current = abortRef.current = null;
      markerMapRef.current = {};
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* ↑ intentionally empty — map is only created once.
       startTracking and fetchHospitals are accessed via closures/refs. */

  /* ══════════════════════════════════════
     REBUILD MARKERS when hospital list changes
     ── selectedId is NOT a dependency here ──
     (prevents popup self-close on click)
  ════════════════════════════════════ */
  useEffect(() => {
    if (!layerRef.current || !L) return;

    /* determine which ids to add / remove */
    const existing = new Set(Object.keys(markerMapRef.current));
    const incoming = new Set(filtered.map(h => h.id));

    /* remove stale markers */
    existing.forEach(id => {
      if (!incoming.has(id)) {
        layerRef.current.removeLayer(markerMapRef.current[id]);
        delete markerMapRef.current[id];
      }
    });

    /* add new markers */
    filtered.forEach(h => {
      if (markerMapRef.current[h.id]) return; // already on map

      const cfg      = A[h.type] || A.hospital;
      const distStr  = h.dist != null ? `${h.dist.toFixed(1)} km away` : '';
      const marker   = L.marker([h.lat, h.lng], { icon: facilityIcon(h.type, false) });

      const badgeHtml = [
        h.hasEmergency ? `<span style="background:#dc2626;color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px">🚨 Emergency</span>` : '',
        h.hasICU       ? `<span style="background:#7c3aed;color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px">ICU</span>` : '',
        h.isGovernment ? `<span style="background:#059669;color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px">Govt</span>` : '',
      ].join('');

      marker.bindPopup(`
        <div style="font-family:'DM Sans',sans-serif;min-width:240px;max-width:300px">
          <div style="font-weight:700;font-size:14px;color:#0c2340;margin-bottom:4px">${cfg.emoji} ${h.name}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">
            <span style="background:${cfg.color}22;color:${cfg.color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px">${cfg.label}</span>
            ${badgeHtml}
          </div>
          ${distStr    ? `<div style="font-size:11px;color:#6b7280;margin-bottom:3px">📏 ${distStr}</div>` : ''}
          ${h.address  ? `<div style="font-size:12px;color:#4a7a8a;margin-bottom:3px">📍 ${h.address}</div>` : ''}
          ${(h.district||h.state) ? `<div style="font-size:11px;color:#64748b;margin-bottom:5px">🗺️ ${[h.district,h.state].filter(Boolean).join(', ')}</div>` : ''}
          ${h.phone    ? `<div style="font-size:12px;margin-bottom:8px">📞 <a href="tel:${h.phone}" style="color:#059669;font-weight:700">${h.phone}</a></div>` : ''}
          <div style="display:flex;flex-direction:column;gap:6px">
            <button id="dr-${h.id}" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;font-weight:700;width:100%">🗺️ Show Route</button>
            ${h.phone   ? `<a href="tel:${h.phone}" style="background:#059669;color:#fff;border-radius:8px;padding:8px;font-size:12px;font-weight:700;text-align:center;text-decoration:none;display:block">📞 Call Now</a>` : ''}
            <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}" target="_blank" rel="noreferrer"
              style="background:#0f766e;color:#fff;border-radius:8px;padding:8px;font-size:12px;font-weight:700;text-align:center;text-decoration:none;display:block">🧭 Open in Google Maps</a>
          </div>
        </div>
      `, { maxWidth: 310 });

      marker.on('popupopen', () => {
        setSelectedId(h.id);
        /* wire "Show Route" btn after popup DOM is ready */
        setTimeout(() => {
          const btn = document.getElementById(`dr-${h.id}`);
          if (btn) btn.onclick = () => drawRouteRef.current(h.lat, h.lng, h.name);
        }, 60);
      });
      marker.on('popupclose', () => setSelectedId(null));

      layerRef.current.addLayer(marker);
      markerMapRef.current[h.id] = marker;
    });
  }, [filtered]); // ← selectedId intentionally excluded — use separate icon effect below

  /* ── Update icon of selected/deselected marker (no full rebuild) ── */
  const prevSelectedRef = useRef(null);
  useEffect(() => {
    if (!L) return;
    const prev = prevSelectedRef.current;
    const curr = selectedId;
    if (prev && markerMapRef.current[prev]) {
      const h = filtered.find(x => x.id === prev);
      if (h) markerMapRef.current[prev].setIcon(facilityIcon(h.type, false));
    }
    if (curr && markerMapRef.current[curr]) {
      const h = filtered.find(x => x.id === curr);
      if (h) markerMapRef.current[curr].setIcon(facilityIcon(h.type, true));
    }
    prevSelectedRef.current = curr;
  }, [selectedId, filtered]);

  /* ─────────────────────────────────────────────────── */
  const srcBadge = dataSource;

  return (
    <div style={{ height, display:'flex', flexDirection:'column', position:'relative', borderRadius:12, overflow:'hidden', fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Emergency Banner ── */}
      {emergencyMode && (
        <div style={{ background:'#dc2626', color:'#fff', padding:'8px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, fontWeight:700, flexShrink:0, animation:'emergencyPulse 1.5s ease-in-out infinite' }}>
          <span>🚨 EMERGENCY — Routing to nearest hospital</span>
          <button onClick={clearRoute} style={{ background:'rgba(255,255,255,.25)', border:'none', borderRadius:6, color:'#fff', padding:'3px 12px', cursor:'pointer', fontSize:12 }}>
            ✕ Cancel
          </button>
        </div>
      )}

      {/* ── Search Bar ── */}
      {showSearchBar && (
        <div style={{ padding:'8px 10px', background:'#0c2340', display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
          <form onSubmit={handleSearch} style={{ flex:1, display:'flex', gap:6 }}>
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search hospital name, city, district…"
              style={{ flex:1, padding:'7px 12px', borderRadius:8, border:'1.5px solid rgba(255,255,255,.22)', background:'rgba(255,255,255,.1)', color:'#fff', fontSize:12, outline:'none' }}
            />
            <button type="submit" disabled={searching}
              style={{ background:'#0891b2', color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', cursor:'pointer', fontSize:14, fontWeight:700, minWidth:44 }}>
              {searching ? '…' : '🔍'}
            </button>
          </form>
          {/* GPS */}
          <button onClick={handleLocate} title="Find my live location"
            style={{ background: isTracking ? '#059669' : 'rgba(255,255,255,.15)', color:'#fff', border:'1.5px solid rgba(255,255,255,.3)', borderRadius:8, padding:'7px 10px', cursor:'pointer', fontSize:14 }}>
            📍
          </button>
          {/* Follow */}
          <button onClick={handleFollow} title="Re-centre on me"
            style={{ background: isFollowing ? '#2563eb' : 'rgba(255,255,255,.15)', color:'#fff', border:'1.5px solid rgba(255,255,255,.3)', borderRadius:8, padding:'7px 10px', cursor:'pointer', fontSize:14 }}>
            🎯
          </button>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      {showFilters && (
        <div style={{ background:'#0f172a', padding:'6px 10px', display:'flex', gap:6, flexShrink:0, overflowX:'auto' }}>
          {FILTER_TABS.map(f => (
            <button key={f.key} onClick={() => setFilterType(f.key)}
              style={{ background: filterType===f.key ? '#2563eb' : 'rgba(255,255,255,.1)', color:'#fff',
                border: filterType===f.key ? 'none' : '1px solid rgba(255,255,255,.18)',
                borderRadius:20, padding:'5px 14px', cursor:'pointer', fontSize:11, fontWeight:600, whiteSpace:'nowrap', flexShrink:0 }}>
              {f.emoji} {f.label}
            </button>
          ))}
          <button onClick={() => setShowFilters(false)}
            style={{ marginLeft:'auto', background:'transparent', color:'rgba(255,255,255,.5)', border:'none', cursor:'pointer', fontSize:13 }}>✕</button>
        </div>
      )}

      {/* ── Banners ── */}
      {searchError && <div style={{ background:'#fee2e2', color:'#b91c1c', padding:'5px 12px', fontSize:12, textAlign:'center', fontWeight:600 }}>{searchError}</div>}
      {gpsError    && <div style={{ background:'#fff7ed', color:'#c2410c', padding:'6px 12px', fontSize:12, textAlign:'center', fontWeight:600, lineHeight:1.5 }}>{gpsError}</div>}

      {/* ── Route Info ── */}
      {routeInfo && (
        <div style={{ background:'#1d4ed8', color:'#fff', padding:'7px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
          <span>🗺️ {routeInfo.name} — {routeInfo.km} km — ~{routeInfo.mins} min drive</span>
          <button onClick={clearRoute} style={{ background:'rgba(255,255,255,.2)', border:'none', borderRadius:6, color:'#fff', padding:'3px 10px', cursor:'pointer', fontSize:11 }}>✕ Clear</button>
        </div>
      )}

      {/* ── Map Container ── */}
      <div style={{ flex:1, position:'relative' }}>
        <div ref={mapDivRef} style={{ width:'100%', height:'100%' }} />

        {/* Loading overlay */}
        {status === 'loading' && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.3)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200, pointerEvents:'none' }}>
            <div style={{ background:'rgba(12,35,64,.92)', borderRadius:14, padding:'18px 28px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <div style={{ width:28, height:28, border:'3px solid #cffafe', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
              <span style={{ color:'#cffafe', fontSize:13, fontWeight:600 }}>Searching hospitals within 30 km…</span>
            </div>
          </div>
        )}

        {/* Route calculating */}
        {routeLoading && (
          <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', background:'rgba(12,35,64,.9)', color:'#cffafe', borderRadius:20, padding:'6px 16px', fontSize:12, zIndex:1300, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:12, height:12, border:'2px solid #cffafe', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
            Calculating route…
          </div>
        )}

        {/* ── FABs ── */}
        <div style={{ position:'absolute', right:12, top:12, display:'flex', flexDirection:'column', gap:8, zIndex:1100 }}>
          <button onClick={handleEmergency} title="Nearest hospital immediately"
            style={{ width:48, height:48, borderRadius:'50%', background:'#dc2626', border:'3px solid #fff', color:'#fff', fontSize:22, cursor:'pointer', boxShadow:'0 4px 16px rgba(220,38,38,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            🚨
          </button>
          <button onClick={() => setShowFilters(v=>!v)} title="Filter"
            style={{ width:42, height:42, borderRadius:'50%', background: showFilters?'#2563eb':'rgba(12,35,64,.85)', border:'2px solid rgba(255,255,255,.35)', color:'#cffafe', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,.4)' }}>
            ⚙️
          </button>
          <button onClick={() => setShowPanel(v=>!v)} title="Hospital list"
            style={{ width:42, height:42, borderRadius:'50%', background: showPanel?'#0891b2':'rgba(12,35,64,.85)', border:'2px solid rgba(255,255,255,.35)', color:'#cffafe', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,.4)' }}>
            ☰
          </button>
        </div>

        {/* ── Legend ── */}
        <div style={{ position:'absolute', bottom: showPanel ? 300 : 46, left:10, background:'rgba(12,35,64,.88)', backdropFilter:'blur(6px)', borderRadius:10, padding:'8px 12px', zIndex:1000 }}>
          {Object.entries(A).map(([key,cfg]) => (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, color:'#cffafe', fontSize:10 }}>
              <span style={{ width:11, height:11, borderRadius:'50%', background:cfg.color, border:'1.5px solid rgba(255,255,255,.6)', display:'inline-block', flexShrink:0 }} />
              {cfg.emoji} {cfg.label}
            </div>
          ))}
          {srcBadge && <div style={{ marginTop:5, paddingTop:4, borderTop:'1px solid rgba(255,255,255,.15)', color:'#94a3b8', fontSize:9, fontWeight:600 }}>Data: {srcBadge}</div>}
        </div>

        {/* ── Status Bar ── */}
        <div style={{ position:'absolute', bottom: showPanel ? 300 : 8, left:'50%', transform:'translateX(-50%)', background:'rgba(12,35,64,.88)', color:'#cffafe', backdropFilter:'blur(4px)', borderRadius:20, padding:'5px 16px', fontSize:11, fontWeight:600, pointerEvents:'none', zIndex:1000, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
          {status==='loading'  && <><span style={{ width:10, height:10, border:'2px solid #cffafe', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />Searching…</>}
          {status==='done'     && `${filtered.length} facilities found${isTracking ? ' · 🟢 Live GPS' : ''}`}
          {status==='fallback' && `${filtered.length} cached facilities${isTracking ? ' · 🟢 GPS active' : ' · Tap 📍 to use your location'}`}
          {status==='error'    && '⚠️ Could not load map'}
          {status==='idle'     && 'Tap 📍 GPS to find hospitals near you'}
        </div>
      </div>

      {/* ── Hospital List Panel ── */}
      {showPanel && (
        <div style={{ height:290, background:'#0a1628', borderTop:'2px solid #1e3a5f', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderBottom:'1px solid #1e3a5f', flexShrink:0 }}>
            <span style={{ color:'#cffafe', fontWeight:700, fontSize:13 }}>
              🏥 {filtered.length} Facilities
              {srcBadge && <span style={{ marginLeft:8, fontSize:10, color:'#64748b', fontWeight:400 }}>{srcBadge}</span>}
            </span>
            <div style={{ display:'flex', gap:5 }}>
              {FILTER_TABS.map(f => (
                <button key={f.key} onClick={() => setFilterType(f.key)}
                  style={{ background: filterType===f.key?'#2563eb':'rgba(255,255,255,.1)', color:'#fff', border:'none', borderRadius:12, padding:'3px 10px', cursor:'pointer', fontSize:10, fontWeight:600 }}>
                  {f.emoji}
                </button>
              ))}
              <button onClick={() => setShowPanel(false)} style={{ background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)', border:'none', borderRadius:12, padding:'3px 10px', cursor:'pointer', fontSize:11 }}>✕</button>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'6px 10px', display:'flex', flexDirection:'column', gap:5 }}>
            {filtered.length === 0 && (
              <div style={{ color:'rgba(255,255,255,.4)', fontSize:12, textAlign:'center', marginTop:24 }}>No facilities found. Tap 📍 GPS to search near you.</div>
            )}
            {filtered.slice(0,60).map((h, i) => {
              const cfg = A[h.type] || A.hospital;
              return (
                <div key={h.id} onClick={() => flyTo(h)}
                  style={{ background: selectedId===h.id ? 'rgba(37,99,235,.25)' : 'rgba(255,255,255,.05)',
                    border:`1px solid ${selectedId===h.id?'#2563eb':'rgba(255,255,255,.1)'}`,
                    borderRadius:10, padding:'8px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#fff',
                    background: i===0?'#dc2626':i===1?'#d97706':i===2?'#059669':'rgba(255,255,255,.2)' }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:'#e0f2fe', fontWeight:700, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {cfg.emoji} {h.name}
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2, flexWrap:'wrap' }}>
                      <span style={{ color:cfg.color, fontSize:10, fontWeight:600 }}>{cfg.label}</span>
                      {h.dist  != null && <span style={{ color:'#94a3b8', fontSize:10 }}>📏 {h.dist.toFixed(1)} km</span>}
                      {h.hasEmergency  && <span style={{ color:'#fca5a5', fontSize:9 }}>🚨 ER</span>}
                      {h.isGovernment  && <span style={{ color:'#6ee7b7', fontSize:9 }}>Govt</span>}
                    </div>
                    {(h.district||h.state) && <div style={{ color:'#475569', fontSize:10, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{[h.district,h.state].filter(Boolean).join(', ')}</div>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
                    <button onClick={e => { e.stopPropagation(); drawRouteRef.current(h.lat,h.lng,h.name); setShowPanel(false); }}
                      style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:6, padding:'4px 8px', fontSize:10, fontWeight:700, cursor:'pointer' }}>
                      Route
                    </button>
                    {h.phone && (
                      <a href={`tel:${h.phone}`} onClick={e => e.stopPropagation()}
                        style={{ background:'#059669', color:'#fff', borderRadius:6, padding:'4px 8px', fontSize:10, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                        Call
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin           { to { transform: rotate(360deg); } }
        @keyframes ripple         { 0%{opacity:.5;transform:scale(.6)} 100%{opacity:0;transform:scale(2.6)} }
        @keyframes emergencyPulse { 0%,100%{background:#dc2626} 50%{background:#b91c1c} }
        .leaflet-popup-content-wrapper { border-radius:12px !important; box-shadow:0 8px 28px rgba(0,0,0,.22) !important; }
        .leaflet-popup-content { margin:14px !important; }
        ::-webkit-scrollbar       { width:4px; }
        ::-webkit-scrollbar-track { background:rgba(255,255,255,.04); }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,.18); border-radius:4px; }
      `}</style>
    </div>
  );
}
