const express = require('express');
const router = express.Router();
const { resetUserPassword, getDashboardStats, getHeatmapData, listUsers, toggleUser, getMalnutritionCases, getAuditLogs, searchAshaWorkers, createAshaWorker } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect, authorize('admin'));

router.get('/search/asha', searchAshaWorkers);
router.post('/asha', createAshaWorker);
router.get('/dashboard', getDashboardStats);
router.get('/heatmap', getHeatmapData);
router.get('/users', listUsers);
router.put('/user/:id/toggle', toggleUser);
router.post('/user/:id/reset-password', resetUserPassword);
router.get('/malnutrition', getMalnutritionCases);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
