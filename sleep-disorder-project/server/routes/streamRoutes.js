/**
 * Real-Time Monitoring Routes
 * API endpoints for streaming data management and statistics
 */

const express = require('express');
const router = express.Router();
const { getUserStats, clearUserBuffer } = require('../services/streamingService');

/**
 * GET /api/stream/stats
 * Get real-time statistics for current user
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.userId; // From auth middleware
        const stats = getUserStats(userId);

        if (!stats) {
            return res.json({
                message: 'No real-time data available yet',
                stats: null
            });
        }

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching stream stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

/**
 * DELETE /api/stream/clear
 * Clear streaming data buffer for current user
 */
router.delete('/clear', async (req, res) => {
    try {
        const userId = req.userId;
        clearUserBuffer(userId);

        res.json({
            success: true,
            message: 'Streaming buffer cleared',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error clearing buffer:', error);
        res.status(500).json({ error: 'Failed to clear buffer' });
    }
});

/**
 * GET /api/stream/status
 * Get WebSocket connection status and metrics
 */
router.get('/status', (req, res) => {
    const { getConnectedClientsCount, getConnectedUsersCount } = require('../websocket');
    
    res.json({
        success: true,
        websocket: {
            enabled: true,
            totalConnections: getConnectedClientsCount(),
            activeUsers: getConnectedUsersCount()
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
