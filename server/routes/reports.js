const express = require('express');
const router = express.Router();
const { childReportPDF, districtReportExcel } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/child/:childId', protect, childReportPDF);
router.get('/district/:districtId', protect, authorize('admin', 'asha'), districtReportExcel);

module.exports = router;
