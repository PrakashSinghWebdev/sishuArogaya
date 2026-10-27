/**
 * All-India health facility importer.
 *
 * Merges three sources into the `hospitals` collection (priority high → low):
 *   1. curated  — server/data/hospitalData.js (hand-checked major hospitals)
 *   2. nhp      — National Health Portal directory (../hospital_directory.csv, data.gov.in)
 *   3. osm      — OpenStreetMap hospitals/clinics/health centres/ambulance stations, fetched per state
 *
 * Usage:  node importHealthData.js            (uses cached OSM downloads if present)
 *         node importHealthData.js --refresh  (re-download OSM)
 *         node importHealthData.js --no-osm   (curated + NHP only, offline)
 *
 * OSM data © OpenStreetMap contributors, ODbL. NHP data: Government Open Data License – India.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const Hospital = require('./models/Hospital');
const CURATED = require('./data/hospitalData');

const NHP_CSV = path.join(__dirname, '..', 'hospital_directory.csv');
const OSM_CACHE = path.join(os.tmpdir(), 'sishu-osm-cache');
const OVERPASS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

// OSM admin_level=4 relation ids for every Indian state / UT
const STATES = {
  'Tamil Nadu': 96905, Puducherry: 107001, 'Himachal Pradesh': 364186, Sikkim: 1791324, Delhi: 1942586,
  'Uttar Pradesh': 1942587, Haryana: 1942601, Punjab: 1942686, Chandigarh: 1942809, Rajasthan: 1942920,
  'Jammu and Kashmir': 1943188, Gujarat: 1949080, 'Madhya Pradesh': 1950071, Maharashtra: 1950884,
  'Dadra and Nagar Haveli and Daman and Diu': 1952530, Bihar: 1958982, 'West Bengal': 1960177, Jharkhand: 1960191,
  Chhattisgarh: 1972004, Odisha: 1984022, Kerala: 2018151, Karnataka: 2019939, 'Andhra Pradesh': 2022095,
  'Andaman and Nicobar Islands': 2025855, Assam: 2025886, Tripura: 2026458, 'Arunachal Pradesh': 2027346,
  Lakshadweep: 2027460, Meghalaya: 2027521, Manipur: 2027869, Nagaland: 2027973, Mizoram: 2029046,
  Telangana: 3250963, Ladakh: 5515045, Uttarakhand: 9987086, Goa: 11251493,
};

const args = new Set(process.argv.slice(2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (v) => {
  const s = String(v ?? '').trim();
  return !s || ['0', 'na', 'n/a', 'nil', 'none', '-'].includes(s.toLowerCase()) ? '' : s;
};
const inIndia = (lat, lng) => lat > 6 && lat < 37.6 && lng > 68 && lng < 97.5;

const PRIMARY_RE = /\b(phc|chc|uphc|sub[\s-]?cent(re|er)|primary health|community health|health (and wellness )?cent(re|er)|health post|aanganwadi|anganwadi)\b/i;
const CLINIC_RE = /\b(clinic|dispensary|polyclinic|poly clinic)\b/i;
// Single-specialty / non-emergency centres: never offer these as "nearest hospital"
const wordsRE = (words) => new RegExp(String.raw`\b(${words.join('|')})\b`, 'i');
const SPECIALTY_RE = wordsRE([
  'eye', 'netralaya', 'nethralaya', 'dental', 'dentist', 'laborator(y|ies)', 'lab', 'diagnostics?', 'pathology',
  'scans?', 'imaging', 'x-?ray', 'ivf', 'fertility', 'skin', String.raw`derma\w*`, 'physiotherapy', String.raw`homoeo\w*`,
  String.raw`homeo\w*`, String.raw`ayurved\w*`, 'unani', 'siddha', 'naturopathy', 'de-?addiction', 'hearing', 'optical', 'optics',
]);
const GOVT_RE = wordsRE([
  'govt', 'government', 'district hospital', 'civil hospital', String.raw`sub[\s-]?district`, 'phc', 'chc', 'uphc', 'aiims',
  'esi', 'esic', 'railway', 'primary health', 'community health', 'general hospital', 'area hospital', 'medical college',
  'state hospital', 'cantonment', 'military', 'army', 'navy', 'air force', 'cghs',
]);

function classify(name, hint = '') {
  if (PRIMARY_RE.test(name) || PRIMARY_RE.test(hint)) return 'health_post';
  if (SPECIALTY_RE.test(name)) return 'clinic';
  if (CLINIC_RE.test(hint) || (!/hospital/i.test(hint) && CLINIC_RE.test(name))) return 'clinic';
  return 'hospital';
}

/* ── source 1: curated ─────────────────────────────────────────────────── */
const fromCurated = () => CURATED.map((h) => ({ ...h, source: 'curated' }));

/* ── source 2: National Health Portal CSV ──────────────────────────────── */
function fromNHP() {
  if (!fs.existsSync(NHP_CSV)) {
    console.warn(`[nhp] ${NHP_CSV} not found — skipping`);
    return Promise.resolve([]);
  }
  return new Promise((resolve, reject) => {
    const out = [];
    fs.createReadStream(NHP_CSV)
      .pipe(csv())
      .on('data', (d) => {
        let [lat, lng] = String(d.Location_Coordinates || '').split(',').map(Number.parseFloat);
        if (!inIndia(lat, lng)) [lat, lng] = [lng, lat]; // some rows are swapped in source
        if (!inIndia(lat, lng)) return;
        const name = clean(d.Hospital_Name);
        if (!name) return;
        const care = clean(d.Hospital_Care_Type);
        out.push({
          name,
          type: classify(name, care),
          address: clean(d.Address_Original_First_Line) || clean(d.Location),
          phone: clean(d.Mobile_Number) || clean(d.Telephone) || clean(d.Helpline) || clean(d.Tollfree),
          emergencyPhone: clean(d.Emergency_Num),
          ambulancePhone: clean(d.Ambulance_Phone_No),
          district: clean(d.District),
          state: clean(d.State),
          pincode: clean(d.Pincode),
          isGovernment: /public|government/i.test(d.Hospital_Category) || GOVT_RE.test(name),
          hasEmergency: !!clean(d.Emergency_Services) || !!clean(d.Emergency_Num),
          hasICU: /\bicu\b/i.test(`${d.Facilities} ${d.Miscellaneous_Facilities} ${d.Specialties}`),
          source: 'nhp',
          location: { type: 'Point', coordinates: [lng, lat] },
        });
      })
      .on('end', () => resolve(flagApproxLocations(out)))
      .on('error', reject);
  });
}

// NHP often stores a city centroid instead of the real location (e.g. 68 hospitals on one Mumbai point),
// and some rows sit in the wrong state. Flag both so they never show as "0.0 km away".
function flagApproxLocations(rows) {
  const key = (f) => f.location.coordinates.map((c) => c.toFixed(4)).join(',');
  const shared = new Map();
  for (const f of rows) shared.set(key(f), (shared.get(key(f)) || 0) + 1);
  const byState = {};
  for (const f of rows) {
    byState[f.state] ??= [];
    byState[f.state].push(f.location.coordinates);
  }
  const median = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];
  const centre = Object.fromEntries(Object.entries(byState).map(([s, cs]) => [s, [median(cs.map((c) => c[0])), median(cs.map((c) => c[1]))]]));
  // District centres from rows that aren't obvious placeholders
  const byDistrict = {};
  for (const f of rows) {
    if (!f.district || shared.get(key(f)) >= 3) continue;
    const d = `${f.state}|${f.district}`;
    byDistrict[d] ??= [];
    byDistrict[d].push(f.location.coordinates);
  }
  const districtCentre = Object.fromEntries(Object.entries(byDistrict).filter(([, cs]) => cs.length >= 5)
    .map(([d, cs]) => [d, [median(cs.map((c) => c[0])), median(cs.map((c) => c[1]))]]));
  const km = ([lng1, lat1], [lng2, lat2]) => Math.hypot(lat1 - lat2, (lng1 - lng2) * Math.cos((lat1 * Math.PI) / 180)) * 111;

  let flagged = 0;
  for (const f of rows) {
    const dc = districtCentre[`${f.state}|${f.district}`];
    // ponytail: median-distance cut-offs are coarse; use real state/district polygons if precision matters
    if (shared.get(key(f)) >= 3 || km(f.location.coordinates, centre[f.state]) > 700 || (dc && km(f.location.coordinates, dc) > 60)) {
      f.approxLocation = true;
      flagged++;
    }
  }
  console.log(`[nhp] ${flagged} rows have placeholder/implausible coordinates (kept for text search, hidden from distance search)`);
  return rows;
}

/* ── source 3: OpenStreetMap, one state at a time ──────────────────────── */
async function overpass(query) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = OVERPASS[attempt % OVERPASS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'SishuArogaya/1.0 (child health app data import)' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(180000),
      });
      if (res.ok) return await res.json(); // NOSONAR: retries are sequential by design
      console.warn(`  ${url} → HTTP ${res.status}, retrying`);
    } catch (err) {
      console.warn(`  ${url} → ${err.message}, retrying`);
    }
    await sleep(5000 * (attempt + 1)); // NOSONAR: back-off between retries
  }
  throw new Error('All Overpass servers failed');
}

// Cached Overpass result for one state, or null if the download failed
async function loadState(state, relId) {
  const cacheFile = path.join(OSM_CACHE, `${relId}.json`);
  if (!args.has('--refresh') && fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

  process.stdout.write(`[osm] ${state}… `);
  try {
    const data = await overpass(`[out:json][timeout:240];area(id:${3600000000 + relId})->.a;(
      nwr["amenity"~"^(hospital|clinic)$"](area.a);
      nwr["healthcare"~"^(hospital|clinic|centre)$"](area.a);
      nwr["emergency"="ambulance_station"](area.a););out center tags;`);
    fs.writeFileSync(cacheFile, JSON.stringify(data));
    console.log(`${data.elements.length} elements`);
    await sleep(2000); // be polite to the free Overpass servers
    return data;
  } catch (err) {
    console.log(`FAILED (${err.message}) — continuing without this state`);
    return null;
  }
}

function osmType(name, kind, isAmbulance) {
  if (isAmbulance) return 'ambulance_station';
  if (kind === 'centre') return 'health_post';
  return classify(name, kind);
}

function fromOSMElement(el, state) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const name = clean(t['name:en'] || t.name);
  if (!name || !inIndia(lat, lng)) return null;
  const isAmbulance = t.emergency === 'ambulance_station';
  return {
    name,
    type: osmType(name, t.amenity || t.healthcare || '', isAmbulance),
    address: [t['addr:housenumber'], t['addr:street'], t['addr:suburb'], t['addr:city']].filter(Boolean).join(', '),
    phone: clean(t.phone || t['contact:phone'] || t['contact:mobile']).split(/[;,]/)[0].trim(),
    emergencyPhone: clean(t['emergency:phone']),
    ambulancePhone: isAmbulance ? clean(t.phone || t['contact:phone']) : '',
    district: clean(t['addr:district'] || t['is_in:district']),
    state,
    pincode: clean(t['addr:postcode']),
    isGovernment: /^(government|public)$/i.test(t['operator:type'] || '') || GOVT_RE.test(name),
    hasEmergency: isAmbulance || t.emergency === 'yes',
    hasICU: false,
    source: 'osm',
    location: { type: 'Point', coordinates: [lng, lat] },
  };
}

async function fromOSM() {
  fs.mkdirSync(OSM_CACHE, { recursive: true });
  const out = [];
  for (const [state, relId] of Object.entries(STATES)) {
    const data = await loadState(state, relId); // NOSONAR: one state at a time to stay within free Overpass limits
    for (const el of data?.elements || []) {
      const f = fromOSMElement(el, state);
      if (f) out.push(f);
    }
  }
  return out;
}

/* ── merge: same normalised name within ~1 km = same facility ──────────── */
const normName = (s) => s.toLowerCase().replace(/[^a-z0-9ऀ-෿]/g, '');
const cellKey = (lat, lng, size) => `${Math.round(lat / size)}:${Math.round(lng / size)}`;

function merge(lists) {
  const byKey = new Map();
  for (const f of lists.flat()) {
    const [lng, lat] = f.location.coordinates;
    // ponytail: grid-cell dedupe misses duplicates straddling a cell edge; fine for display, use a geo join if exact counts matter
    const key = `${normName(f.name)}@${cellKey(lat, lng, 0.01)}`;
    const existing = byKey.get(key);
    if (!existing) { byKey.set(key, f); continue; }
    // higher-priority source wins; only fill its gaps from the duplicate
    for (const k of ['phone', 'emergencyPhone', 'ambulancePhone', 'address', 'district', 'pincode']) {
      if (!existing[k] && f[k]) existing[k] = f[k];
    }
    if (existing.approxLocation && !f.approxLocation) {
      existing.location = f.location;
      existing.approxLocation = false;
    }
    existing.hasEmergency ||= f.hasEmergency;
    existing.hasICU ||= f.hasICU;
    existing.isGovernment ||= f.isGovernment;
  }
  return [...byKey.values()];
}

// OSM rarely tags districts: borrow the district of the nearest facility (≤ ~25 km) that has one.
function fillDistricts(facilities) {
  const size = 0.25;
  const grid = new Map();
  for (const f of facilities) {
    if (!f.district || f.approxLocation) continue;
    const [lng, lat] = f.location.coordinates;
    const k = cellKey(lat, lng, size);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(f);
  }
  let filled = 0;
  for (const f of facilities) {
    if (f.district) continue;
    const best = nearestInGrid(grid, size, f.location.coordinates);
    if (best) { f.district = best.district; filled++; }
  }
  return filled;
}

// Closest facility in the 3×3 surrounding cells, within ~25 km
function nearestInGrid(grid, size, [lng, lat]) {
  const [cy, cx] = cellKey(lat, lng, size).split(':').map(Number);
  const neighbours = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].flatMap((dx) => grid.get(`${cy + dy}:${cx + dx}`) || []));
  let best = null; let bestD = 0.05;
  for (const g of neighbours) {
    const [glng, glat] = g.location.coordinates;
    const d = (glat - lat) ** 2 + (glng - lng) ** 2;
    if (d < bestD) { bestD = d; best = g; }
  }
  return best;
}

async function main() {
  const curated = fromCurated();
  const nhp = await fromNHP();
  console.log(`[curated] ${curated.length}  [nhp] ${nhp.length} with valid coordinates`);
  const osm = args.has('--no-osm') ? [] : await fromOSM();
  console.log(`[osm] ${osm.length} named facilities`);

  const facilities = merge([curated, nhp, osm]);
  const filled = fillDistricts(facilities);
  console.log(`[merge] ${facilities.length} unique facilities (${filled} districts inferred)`);

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sishuarogaya');
  await Hospital.deleteMany({});
  await Hospital.insertMany(facilities, { ordered: false }); // driver splits into server-sized batches
  await Hospital.syncIndexes();

  const byType = await Hospital.aggregate([{ $group: { _id: '$type', n: { $sum: 1 } } }]);
  const states = (await Hospital.distinct('state')).length;
  console.log(`[done] ${await Hospital.countDocuments()} facilities across ${states} states/UTs`, byType.map((t) => `${t._id}:${t.n}`).join(' '));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
