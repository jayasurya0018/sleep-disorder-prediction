const express = require('express');
const router = express.Router();

const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/auth');


// POST /api/data/save - Save sleep data
router.post('/save', authMiddleware, dataController.saveData);
// GET /api/data/history - Get sleep data history
router.get('/history', authMiddleware, dataController.getHistory);
// POST /api/data/import-smartwatch - Import data from smartwatch (mock)
router.post('/import-smartwatch', authMiddleware, dataController.importSmartwatchData);

module.exports = router;






