const { spawn } = require('child_process');
const fs = require('fs');
const SleepData = require('../models/SleepData');

exports.analyze = async (req, res) => {
    const axios = require('axios');
    const userId = req.userId;
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
        const response = await axios.post('http://localhost:5002/predict', mlInput, { timeout: 3000 });
        console.log('ML ANALYZE: ML API response:', response.data);
        return res.json(response.data);
    } catch (error) {
        console.error('ML ANALYZE ERROR (HTTP ML service):', error.message, error.response && error.response.data);
        // Fallback: run local Python CLI (predict_cli.py) if HTTP ML service is unavailable
        try {
            const py = spawn('python', ['predict_cli.py'], { cwd: __dirname.replace('/server/controllers', '/ml') });
            py.stdin.write(JSON.stringify(mlInput));
            py.stdin.end();
            let out = '';
            let err = '';
            py.stdout.on('data', (d) => out += d.toString());
            py.stderr.on('data', (d) => err += d.toString());
            py.on('close', (code) => {
                if (err) console.error('ML CLI stderr:', err);
                try {
                    const parsed = JSON.parse(out);
                    return res.json(parsed);
                } catch (e) {
                    console.error('ML CLI parse error:', e, 'raw out:', out);
                    return res.status(500).json({ error: 'ML service failure', details: out || err });
                }
            });
        } catch (cliErr) {
            console.error('ML ANALYZE ERROR (CLI fallback):', cliErr);
            return res.status(500).json({ error: error.message, details: error.response && error.response.data });
        }
    }
};

exports.getRecommendations = async (req, res) => {
    const axios = require('axios');
    const userId = req.userId;
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