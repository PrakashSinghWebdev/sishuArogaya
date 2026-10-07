const Hospital = require('../models/Hospital');
const escapeRegex = require('../utils/escapeRegex');
const { nearest, EMERGENCY_NUMBERS } = require('../utils/healthDirectory');

/**
 * GET /api/hospitals/nearby?lat=&lng=&radius=30000&type=all
 * Returns hospitals within radius (meters) sorted by distance.
 */
exports.getNearby = async (req, res) => {
  try {
    const lat    = parseFloat(req.query.lat);
    const lng    = parseFloat(req.query.lng);
    const radius = parseInt(req.query.radius) || 30000; // metres
    const type   = req.query.type || 'all';

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query params are required.' });
    }

    const matchStage = { isActive: true, approxLocation: { $ne: true } };
    if (type !== 'all') matchStage.type = type;

    const hospitals = await Hospital.aggregate([
      {
        $geoNear: {
          near:          { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance:   radius,
          spherical:     true,
          query:         matchStage,
        },
      },
      { $limit: 200 },
      {
        $project: {
          name: 1, type: 1, address: 1, phone: 1, emergencyPhone: 1, ambulancePhone: 1,
          district: 1, state: 1, pincode: 1, isGovernment: 1,
          hasEmergency: 1, hasICU: 1,
          location: 1, distanceMeters: 1,
        },
      },
    ]);

    res.json({ count: hospitals.length, hospitals });
  } catch (err) {
    console.error('getNearby error:', err.message);
    res.status(500).json({ message: 'Server error fetching nearby hospitals.' });
  }
};

/**
 * GET /api/hospitals/search?q=aiims&lat=&lng=
 * Full-text search with optional distance sorting.
 */
exports.searchHospitals = async (req, res) => {
  try {
    const q   = (req.query.q || '').trim();
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (!q) return res.status(400).json({ message: 'Search query q is required.' });

    // Text search
    let hospitals = await Hospital.find(
      { $text: { $search: q }, isActive: true, approxLocation: { $ne: true } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(50);

    // If no text match, fallback to regex
    if (!hospitals.length) {
      hospitals = await Hospital.find({
        isActive: true,
        approxLocation: { $ne: true },
        $or: [
          { name:     { $regex: escapeRegex(q), $options: 'i' } },
          { district: { $regex: escapeRegex(q), $options: 'i' } },
          { state:    { $regex: escapeRegex(q), $options: 'i' } },
          { address:  { $regex: escapeRegex(q), $options: 'i' } },
        ],
      }).limit(50);
    }

    // Attach distance if coords provided
    if (!isNaN(lat) && !isNaN(lng)) {
      const R = 6371000;
      const toRad = x => (x * Math.PI) / 180;
      hospitals = hospitals.map(h => {
        const [hLng, hLat] = h.location.coordinates;
        const dLat = toRad(hLat - lat);
        const dLng = toRad(hLng - lng);
        const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat))*Math.cos(toRad(hLat))*Math.sin(dLng/2)**2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return { ...h.toObject(), distanceMeters: Math.round(dist) };
      }).sort((a,b) => a.distanceMeters - b.distanceMeters);
    }

    res.json({ count: hospitals.length, hospitals });
  } catch (err) {
    console.error('searchHospitals error:', err.message);
    res.status(500).json({ message: 'Server error during search.' });
  }
};

/**
 * GET /api/hospitals/emergency?lat=&lng=
 * National ambulance/helpline numbers (same in every state) + nearest hospitals if coordinates are given.
 */
exports.getEmergency = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const hospitals = Number.isFinite(lat) && Number.isFinite(lng)
      ? await nearest({ lat, lng }, { limit: 5, maxKm: 100, types: ['hospital', 'ambulance_station'] })
      : [];
    res.json({ numbers: EMERGENCY_NUMBERS, hospitals });
  } catch (err) {
    console.error('getEmergency error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/hospitals/:id
 */
exports.getHospital = async (req, res) => {
  try {
    if (!require('mongoose').isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Hospital not found.' });
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found.' });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * GET /api/hospitals  (admin: list all)
 */
exports.listAll = async (req, res) => {
  try {
    const { state, district, type, emergency } = req.query;
    const filter = { isActive: true };
    if (state)     filter.state    = { $regex: escapeRegex(state), $options: 'i' };
    if (district)  filter.district = { $regex: escapeRegex(district), $options: 'i' };
    if (type && type !== 'all') filter.type = type;
    if (emergency === 'true')   filter.hasEmergency = true;

    // List is capped for the browser; stats count the whole matching set
    const [hospitals, total, emergencyCount, government, icu] = await Promise.all([
      Hospital.find(filter).sort({ hasEmergency: -1, isGovernment: -1, name: 1 }).limit(500),
      Hospital.countDocuments(filter),
      Hospital.countDocuments({ ...filter, hasEmergency: true }),
      Hospital.countDocuments({ ...filter, isGovernment: true }),
      Hospital.countDocuments({ ...filter, hasICU: true }),
    ]);
    res.json({ count: hospitals.length, hospitals, stats: { total, emergency: emergencyCount, government, icu } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
