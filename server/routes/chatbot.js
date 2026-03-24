const express = require('express');
const router = express.Router();
const { query } = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

router.post('/query', protect, query);

module.exports = router;
