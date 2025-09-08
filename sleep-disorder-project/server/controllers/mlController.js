const { spawn } = require('child_process');
const fs = require('fs');
const SleepData = require('../models/SleepData');

exports.analyze = async (req, res) => {
    const axios = require('axios');
    const userId = req.user.id;
    const latestData = await SleepData.findOne({ userId }).sort({ timestamp: -1 });
    if (!latestData) {
        return res.status(400).json({ error: 'No sleep data found for analysis.' });
    }
    // Validate all required fields are present and not null/undefined
    const requiredFields = ['sleepStages', 'hrv', 'spo2', 'movement', 'breathing'];
    const missingFields = requiredFields.filter(f => latestData[f] === undefined || latestData[f] === null || (Array.isArray(latestData[f]) && latestData[f].length === 0));
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing or incomplete data for: ${missingFields.join(', ')}` });
    }
    // Map 'spo2' to 'blood_oxygen' for ML API compatibility
    const mlInput = {
        sleepStages: Array.isArray(latestData.sleepStages) ? latestData.sleepStages.join(',') : latestData.sleepStages,
        hrv: latestData.hrv,
        blood_oxygen: latestData.spo2, // Map field
        movement: latestData.movement,
        breathing: latestData.breathing
    };
    try {
        console.log('ML ANALYZE: Sending to ML API:', mlInput);
        const response = await axios.post('http://localhost:5002/predict', mlInput);
        console.log('ML ANALYZE: ML API response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('ML ANALYZE ERROR:', error.message, error.response && error.response.data);
        res.status(500).json({ error: error.message, details: error.response && error.response.data });
    }
};

exports.getRecommendations = async (req, res) => {
    const axios = require('axios');
    const userId = req.user.id;
    const latestData = await SleepData.findOne({ userId }).sort({ timestamp: -1 });
    if (!latestData) {
        return res.status(400).json({ error: 'No sleep data found for recommendations.' });
    }
    // Map 'spo2' to 'blood_oxygen' for ML API compatibility
    const mlInput = {
        sleepStages: Array.isArray(latestData.sleepStages) ? latestData.sleepStages.join(',') : latestData.sleepStages,
        hrv: latestData.hrv,
        blood_oxygen: latestData.spo2, // Map field
        movement: latestData.movement,
        breathing: latestData.breathing
    };
    try {
        // TODO: Integrate real smartwatch data here if available
    const response = await axios.post('http://localhost:5002/predict', mlInput);
        // Return only recommendations part if present
        res.json(response.data.recommendations || response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};