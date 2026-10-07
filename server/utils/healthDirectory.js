// Retrieval over the all-India facility directory (hospitals collection).
// Used by the hospitals API and by the chatbot (retrieval-augmented answers).
const Hospital = require('../models/Hospital');
const EMERGENCY_NUMBERS = require('../data/emergencyNumbers');
const escapeRegex = require('./escapeRegex');

const FIELDS = 'name type address phone emergencyPhone ambulancePhone district state pincode isGovernment hasEmergency hasICU location';

// Nearest facilities to a point. Emergency-capable and government hospitals float up among similar distances.
async function nearest({ lat, lng }, { limit = 5, maxKm = 50, types = ['hospital', 'health_post', 'clinic', 'ambulance_station'] } = {}) {
  return Hospital.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceMeters',
        maxDistance: maxKm * 1000,
        spherical: true,
        query: { isActive: true, approxLocation: { $ne: true }, type: { $in: types } },
      },
    },
    { $limit: limit },
  ]);
}

// District / state names known to the directory, cached for place matching in free text.
let placeCache = { at: 0, districts: [], states: [] };
async function knownPlaces() {
  if (Date.now() - placeCache.at < 3600_000 && placeCache.states.length) return placeCache;
  const [districts, states] = await Promise.all([Hospital.distinct('district'), Hospital.distinct('state')]);
  // Longest first so "South Delhi" wins over "Delhi"; skip very short names that collide with ordinary words.
  const prep = (arr) => arr.filter((s) => s && s.length >= 4).sort((a, b) => b.length - a.length);
  placeCache = { at: Date.now(), districts: prep(districts), states: prep(states) };
  return placeCache;
}

// Find a pincode, district or state mentioned in the text. Returns a Mongo filter + label, or null.
async function placeFromText(text) {
  const pin = String(text).match(/\b[1-9]\d{5}\b/);
  if (pin) {
    // exact pincode, else same 3-digit sorting district (e.g. 248xxx = Dehradun area)
    if (await Hospital.exists({ pincode: pin[0] })) return { filter: { pincode: pin[0] }, label: `pincode ${pin[0]}` };
    return { filter: { pincode: { $regex: `^${pin[0].slice(0, 3)}` } }, label: `the ${pin[0].slice(0, 3)}xxx pincode area` };
  }
  const { districts, states } = await knownPlaces();
  const lower = String(text).toLowerCase();
  const hit = (name) => new RegExp(`\\b${escapeRegex(name.toLowerCase())}\\b`).test(lower);
  const district = districts.find(hit);
  if (district) return { filter: { district }, label: district };
  const state = states.find(hit);
  if (state) return { filter: { state }, label: state };
  return null;
}

async function inPlace(filter, limit = 5) {
  return Hospital.find({ ...filter, isActive: true, type: { $in: ['hospital', 'health_post', 'ambulance_station'] } })
    .select(FIELDS)
    .sort({ hasEmergency: -1, isGovernment: -1, type: 1 })
    .limit(limit)
    .lean();
}

module.exports = { nearest, placeFromText, inPlace, EMERGENCY_NUMBERS };
