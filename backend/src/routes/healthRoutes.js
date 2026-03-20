const express = require('express');
const router = express.Router();
const { saveHealthData, getHealthData, getHealthHistory } = require('../controllers/healthController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/save', authMiddleware, saveHealthData);
router.get('/data', authMiddleware, getHealthData);
router.get('/history', authMiddleware, getHealthHistory);

module.exports = router;