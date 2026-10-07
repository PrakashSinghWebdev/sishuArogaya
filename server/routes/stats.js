const express = require('express');
const Child = require('../models/Child');
const AshaWorker = require('../models/AshaWorker');
const Hospital = require('../models/Hospital');

const router = express.Router();

// GET /api/stats/public — live, aggregate-only numbers for the public site (no personal data)
router.get('/public', async (req, res) => {
  try {
    const [children, ashaWorkers, hospitals, childDistricts, ashaDistricts] = await Promise.all([
      Child.countDocuments({ isActive: true }),
      AshaWorker.countDocuments({ isActive: true }),
      Hospital.countDocuments({ isActive: true }),
      Child.distinct('district', { isActive: true }),
      AshaWorker.distinct('district', { isActive: true }),
    ]);
    // "Haridwar" and "haridwar " are the same district
    const districts = new Set([...childDistricts, ...ashaDistricts].filter(Boolean).map((d) => d.trim().toLowerCase())).size;
    res.json({ children, ashaWorkers, districts, hospitals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
