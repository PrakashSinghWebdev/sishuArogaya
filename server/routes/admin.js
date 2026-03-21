const express = require('express');
const router = express.Router();
const { getDashboardStats, getHeatmapData, listUsers, toggleUser, getMalnutritionCases, getAuditLogs } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/heatmap', getHeatmapData);
router.get('/users', listUsers);
router.put('/user/:id/toggle', toggleUser);
router.get('/malnutrition', getMalnutritionCases);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
