const Hospital = require('../models/Hospital');

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

    const matchStage = { isActive: true };
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
          name: 1, type: 1, address: 1, phone: 1,
          district: 1, state: 1, isGovernment: 1,
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
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(50);

    // If no text match, fallback to regex
    if (!hospitals.length) {
      hospitals = await Hospital.find({
        isActive: true,
        $or: [
          { name:     { $regex: q, $options: 'i' } },
          { district: { $regex: q, $options: 'i' } },
          { state:    { $regex: q, $options: 'i' } },
          { address:  { $regex: q, $options: 'i' } },
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
 * GET /api/hospitals/:id
 */
exports.getHospital = async (req, res) => {
  try {
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
    if (state)     filter.state    = { $regex: state, $options: 'i' };
    if (district)  filter.district = { $regex: district, $options: 'i' };
    if (type && type !== 'all') filter.type = type;
    if (emergency === 'true')   filter.hasEmergency = true;

    const hospitals = await Hospital.find(filter).limit(500);
    res.json({ count: hospitals.length, hospitals });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
