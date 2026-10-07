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
const fs = require('fs');
const os = require('os');
const path = require('path');
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
const SPECIALTY_RE = /\b(eye|netralaya|nethralaya|dental|dentist|laborator(y|ies)|lab|diagnostics?|pathology|scans?|imaging|x-?ray|ivf|fertility|skin|derma\w*|physiotherapy|homoeo\w*|homeo\w*|ayurved\w*|unani|siddha|naturopathy|de-?addiction|hearing|optical|optics)\b/i;
const GOVT_RE = /\b(govt|government|district hospital|civil hospital|sub[\s-]?district|phc|chc|uphc|aiims|esi|esic|railway|primary health|community health|general hospital|area hospital|medical college|state hospital|cantonment|military|army|navy|air force|cghs)\b/i;

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
        let [lat, lng] = String(d.Location_Coordinates || '').split(',').map((x) => parseFloat(x));
        if (!inIndia(lat, lng) && inIndia(lng, lat)) [lat, lng] = [lng, lat]; // swapped in source
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
  for (const f of rows) (byState[f.state] ||= []).push(f.location.coordinates);
  const median = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];
  const centre = Object.fromEntries(Object.entries(byState).map(([s, cs]) => [s, [median(cs.map((c) => c[0])), median(cs.map((c) => c[1]))]]));
  // District centres from rows that aren't obvious placeholders
  const byDistrict = {};
  for (const f of rows) if (f.district && shared.get(key(f)) < 3) (byDistrict[`${f.state}|${f.district}`] ||= []).push(f.location.coordinates);
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
      if (res.ok) return await res.json();
      console.warn(`  ${url} → HTTP ${res.status}, retrying`);
    } catch (err) {
      console.warn(`  ${url} → ${err.message}, retrying`);
    }
    await sleep(5000 * (attempt + 1));
  }
  throw new Error('All Overpass servers failed');
}

async function fromOSM() {
  fs.mkdirSync(OSM_CACHE, { recursive: true });
  const out = [];
  for (const [state, relId] of Object.entries(STATES)) {
    const cacheFile = path.join(OSM_CACHE, `${relId}.json`);
    let data;
    if (!args.has('--refresh') && fs.existsSync(cacheFile)) {
      data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } else {
      process.stdout.write(`[osm] ${state}… `);
      try {
        data = await overpass(`[out:json][timeout:240];area(id:${3600000000 + relId})->.a;(
          nwr["amenity"~"^(hospital|clinic)$"](area.a);
          nwr["healthcare"~"^(hospital|clinic|centre)$"](area.a);
          nwr["emergency"="ambulance_station"](area.a););out center tags;`);
        fs.writeFileSync(cacheFile, JSON.stringify(data));
        console.log(`${data.elements.length} elements`);
      } catch (err) {
        console.log(`FAILED (${err.message}) — continuing without this state`);
        continue;
      }
      await sleep(2000); // be polite to the free Overpass servers
    }

    for (const el of data.elements) {
      const t = el.tags || {};
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      const name = clean(t['name:en'] || t.name);
      if (!name || !inIndia(lat, lng)) continue;
      const isAmbulance = t.emergency === 'ambulance_station';
      const kind = t.amenity || t.healthcare || '';
      out.push({
        name,
        type: isAmbulance ? 'ambulance_station' : kind === 'centre' ? 'health_post' : classify(name, kind),
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
      });
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
    const [lng, lat] = f.location.coordinates;
    const [cy, cx] = cellKey(lat, lng, size).split(':').map(Number);
    let best = null; let bestD = Infinity;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      for (const g of grid.get(`${cy + dy}:${cx + dx}`) || []) {
        const [glng, glat] = g.location.coordinates;
        const d = (glat - lat) ** 2 + (glng - lng) ** 2;
        if (d < bestD) { bestD = d; best = g; }
      }
    }
    if (best && bestD < 0.05) { f.district = best.district; filled++; }
  }
  return filled;
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
  for (let i = 0; i < facilities.length; i += 2000) {
    await Hospital.insertMany(facilities.slice(i, i + 2000), { ordered: false });
  }
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
