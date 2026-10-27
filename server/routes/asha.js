const express = require('express');
const router = express.Router();
const { search, getProfile, logVisit, getVisits, getVisitPlan, getFamilies, getMyChildren, listWorkers, assignChild, unassignChild, getCheckupQueue, toggleCheckupQueue } = require('../controllers/ashaController');
const { protect } = require('../middleware/auth');
const insights = require('../controllers/ashaInsightsController');
const { authorize } = require('../middleware/role');

router.get('/profile', protect, authorize('asha'), getProfile);
router.get('/children', protect, authorize('asha'), getMyChildren);
router.post('/visit', protect, authorize('asha'), logVisit);
router.get('/visits', protect, authorize('asha'), getVisits);
router.get('/visit-plan', protect, authorize('asha'), getVisitPlan);
router.get('/families', protect, authorize('asha'), getFamilies);
router.get('/search', protect, authorize('asha'), search);
router.get('/dashboard', protect, authorize('asha'), insights.getDashboard);
router.get('/vaccination-status', protect, authorize('asha'), insights.getVaccinationStatus);
router.get('/report', protect, authorize('asha'), insights.getReport);
router.get('/workers', protect, authorize('admin'), listWorkers);
router.post('/assign', protect, authorize('admin'), assignChild);
router.post('/unassign', protect, authorize('admin'), unassignChild);
router.get('/checkup-queue', protect, authorize('asha'), getCheckupQueue);
router.post('/checkup-queue', protect, authorize('asha'), toggleCheckupQueue);

module.exports = router;
