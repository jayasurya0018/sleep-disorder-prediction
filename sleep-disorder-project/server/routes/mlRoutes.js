const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');

// POST /api/ml/analyze - Run ML analysis (protected route)
router.post('/analyze', mlController.analyze);

// GET /api/ml/recommendations - Get recommendations based on latest analysis (protected route)
router.get('/recommendations', mlController.getRecommendations);

module.exports = router;