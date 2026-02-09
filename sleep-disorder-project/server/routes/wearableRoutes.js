/**
 * Wearable Device Routes
 * API endpoints for connecting and managing wearable devices
 */

const express = require('express');
const router = express.Router();
const wearableService = require('../services/wearableService');

/**
 * POST /api/wearable/connect/fitbit
 * Connect Fitbit device
 */
router.post('/connect/fitbit', async (req, res) => {
    try {
        const userId = req.userId;
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'Access token required' });
        }

        const result = await wearableService.connectFitbit(userId, accessToken);
        res.json({
            success: true,
            message: 'Fitbit connected successfully',
            ...result
        });

    } catch (error) {
        console.error('Fitbit connect error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/wearable/connect/oura
 * Connect Oura Ring
 */
router.post('/connect/oura', async (req, res) => {
    try {
        const userId = req.userId;
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'Access token required' });
        }

        const result = await wearableService.connectOura(userId, accessToken);
        res.json({
            success: true,
            message: 'Oura Ring connected successfully',
            ...result
        });

    } catch (error) {
        console.error('Oura connect error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/wearable/connect/zepp
 * Connect Zepp Life device
 */
router.post('/connect/zepp', async (req, res) => {
    try {
        const userId = req.userId;
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'Access token required' });
        }

        const result = await wearableService.connectZepp(userId, accessToken);
        res.json({
            success: true,
            message: 'Zepp Life connected successfully',
            ...result
        });

    } catch (error) {
        console.error('Zepp Life connect error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/wearable/connect/mifitness
 * Connect Mi Fitness device
 */
router.post('/connect/mifitness', async (req, res) => {
    try {
        const userId = req.userId;
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'Access token required' });
        }

        const result = await wearableService.connectMiFitness(userId, accessToken);
        res.json({
            success: true,
            message: 'Mi Fitness connected successfully',
            ...result
        });

    } catch (error) {
        console.error('Mi Fitness connect error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/wearable/start-streaming
 * Start streaming data from connected device
 */
router.post('/start-streaming', async (req, res) => {
    try {
        const userId = req.userId;
        const { intervalSeconds = 5 } = req.body;

        const status = wearableService.getConnectionStatus(userId);
        if (!status.connected) {
            return res.status(400).json({ error: 'No device connected' });
        }

        // Note: WebSocket instance should be passed from WebSocket handler
        // For now, we'll just acknowledge the request
        res.json({
            success: true,
            message: 'Streaming will start on WebSocket connection',
            device: status.device,
            interval: intervalSeconds
        });

    } catch (error) {
        console.error('Start streaming error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/wearable/stop-streaming
 * Stop streaming data
 */
router.post('/stop-streaming', async (req, res) => {
    try {
        const userId = req.userId;
        wearableService.stopPolling(userId);

        res.json({
            success: true,
            message: 'Streaming stopped'
        });

    } catch (error) {
        console.error('Stop streaming error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/wearable/disconnect
 * Disconnect wearable device
 */
router.delete('/disconnect', async (req, res) => {
    try {
        const userId = req.userId;
        wearableService.disconnect(userId);

        res.json({
            success: true,
            message: 'Device disconnected'
        });

    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/wearable/status
 * Get connection status
 */
router.get('/status', (req, res) => {
    try {
        const userId = req.userId;
        const status = wearableService.getConnectionStatus(userId);

        res.json({
            success: true,
            ...status
        });

    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/wearable/test-fetch
 * Test fetching data from connected device
 */
router.get('/test-fetch', async (req, res) => {
    try {
        const userId = req.userId;
        const status = wearableService.getConnectionStatus(userId);

        if (!status.connected) {
            return res.status(400).json({ error: 'No device connected' });
        }

        let data;
        if (status.device === 'fitbit') {
            data = await wearableService.fetchFitbitData(userId);
        } else if (status.device === 'oura') {
            data = await wearableService.fetchOuraData(userId);
        }

        res.json({
            success: true,
            device: status.device,
            data
        });

    } catch (error) {
        console.error('Test fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
