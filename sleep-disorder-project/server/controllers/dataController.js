// Import smartwatch data (mock, ready for real API integration)
const streamingService = require('../services/streamingService');

exports.importSmartwatchData = async (req, res) => {
    // TODO: Integrate with real smartwatch API (e.g., Fitbit, Google Fit, Apple Health)
    // For now, mock some realistic data
    const mockData = {
        sleepStages: ['Awake', 'REM', 'Deep', 'Light'],
        hrv: 65,
        spo2: 97,
        movement: 12,
        breathing: 16,
        userId: req.userId
    };
    try {
        const SleepData = require('../models/SleepData');
        const data = new SleepData(mockData);
        await data.save();
        
        // Add to streaming buffer
        const streamData = {
            userId: req.userId,
            timestamp: new Date().toISOString(),
            heartRate: mockData.hrv * 1.2,
            hrv: mockData.hrv,
            spo2: mockData.spo2,
            respiratoryRate: mockData.breathing,
            sleepStage: 'Light',
            movement: mockData.movement,
            temperature: 36.5,
            prediction: { disorder: 'Normal', severity: 'None', confidence: 100 }
        };
        const buffer = streamingService.getUserBuffer(req.userId);
        buffer.push(streamData);
        
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
    
    try {
        const data = new SleepData({ sleepStages: stages, hrv, spo2, movement, breathing, userId: req.userId });
        await data.save();
        
        // Add to streaming buffer for export functionality
        const streamData = {
            userId: req.userId,
            timestamp: new Date().toISOString(),
            heartRate: hrv * 1.2,
            hrv: hrv,
            spo2: spo2,
            respiratoryRate: breathing,
            sleepStage: stages[stages.length - 1] || 'Unknown',
            movement: movement,
            temperature: 36.5,
            prediction: {
                disorder: 'Normal',
                severity: 'None',
                confidence: 100
            }
        };
        
        const buffer = streamingService.getUserBuffer(req.userId);
        buffer.push(streamData);
        
        res.json({ message: 'Data saved successfully', data: data });
    } catch (error) {
        console.error('Save data error:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        console.log('History request - User ID:', req.userId);
        // Return all SleepData for this user, sorted by timestamp descending
        const SleepData = require('../models/SleepData');
        const sleepHistory = await SleepData.find({ userId: req.userId }).sort({ timestamp: -1 });
        res.json(sleepHistory);
    } catch (err) {
        console.error('SleepData history error:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

