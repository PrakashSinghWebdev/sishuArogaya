const express = require('express');
const router  = express.Router();
const { getNearby, searchHospitals, getHospital, listAll } = require('../controllers/hospitalController');

// Public routes — no auth needed (used by map)
router.get('/nearby',   getNearby);
router.get('/search',   searchHospitals);
router.get('/:id',      getHospital);
router.get('/',         listAll);

module.exports = router;
