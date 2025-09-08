// Import smartwatch data (mock, ready for real API integration)
exports.importSmartwatchData = async (req, res) => {
    // TODO: Integrate with real smartwatch API (e.g., Fitbit, Google Fit, Apple Health)
    // For now, mock some realistic data
    const mockData = {
        sleepStages: ['Awake', 'REM', 'Deep', 'Light'],
        hrv: 65,
        spo2: 97,
        movement: 12,
        breathing: 16,
        userId: req.user.id
    };
    try {
        const SleepData = require('../models/SleepData');
        const data = new SleepData(mockData);
        await data.save();
        res.json({ message: 'Smartwatch data imported successfully!', data: mockData });
    } catch (err) {
        res.status(500).json({ error: 'Failed to import smartwatch data.' });
    }
};
const SleepData = require('../models/SleepData');
const mongoose = require('mongoose');
const History = require('../models/history');
exports.saveData = async (req, res) => {
    // Validate input
    const { sleepStages, hrv, spo2, movement, breathing } = req.body;
    const validSleepStages = ["Awake", "REM", "Light", "Deep"];
    let stages = [];
    if (Array.isArray(sleepStages)) {
        stages = sleepStages;
    } else if (typeof sleepStages === 'string') {
        stages = sleepStages.split(',');
    }
    // Only keep valid names
    stages = stages.filter(s => validSleepStages.includes(s));
    // All numeric fields must be numbers
    if (
        !stages.length ||
        typeof hrv !== 'number' || isNaN(hrv) ||
        typeof spo2 !== 'number' || isNaN(spo2) ||
        typeof movement !== 'number' || isNaN(movement) ||
        typeof breathing !== 'number' || isNaN(breathing)
    ) {
        return res.status(400).json({ error: 'Invalid data format. Please enter valid sleep stages and numeric values.' });
    }
    const data = new SleepData({ sleepStages: stages, hrv, spo2, movement, breathing, userId: req.user.id });
    await data.save();
    res.send('Data saved');
};

exports.getHistory = async (req, res) => {
    try {
        console.log('History request - User ID:', req.user.id);
        // Return all SleepData for this user, sorted by timestamp descending
        const SleepData = require('../models/SleepData');
        const sleepHistory = await SleepData.find({ userId: req.user.id }).sort({ timestamp: -1 });
        res.json(sleepHistory);
    } catch (err) {
        console.error('SleepData history error:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

