/**
 * Email Alert Routes
 * API endpoints for managing email notifications
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const { triggerDailySummaryNow } = require('../jobs/dailySummaryJob');

// Rate limit email test endpoint (max 10 per hour per user)
const emailTestLimiter = rateLimit({
    windowMs: 3600000, // 1 hour
    max: 10,
    keyGenerator: (req) => req.userId, // Per user, not IP
    message: { error: 'Too many test emails sent. Try again in 1 hour.' },
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    skip: (req) => !req.userId // Skip if not authenticated
});

/**
 * POST /api/email/test
 * Send a test email
 */
router.post('/test', emailTestLimiter, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate email format
        if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
            return res.status(400).json({ error: 'User email is invalid or not set' });
        }

        // Check if email service is initialized
        if (!emailService.initialized) {
            return res.status(503).json({ 
                error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.',
                success: false
            });
        }

        const testAlertData = {
            title: 'Test Alert - System Check',
            message: 'This is a test email from your Sleep Disorder Monitoring System.',
            severity: 'low',
            timestamp: new Date().toISOString(),
            metrics: {
                hrv: 55,
                blood_oxygen: 96,
                breathing: 15,
                sleepStage: 'Light'
            }
        };

        const result = await emailService.sendAlert(user.email, testAlertData);

        if (result.success) {
            res.json({
                success: true,
                message: 'Test email sent successfully',
                messageId: result.messageId,
                recipient: user.email
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || result.reason
            });
        }

    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/email/preferences
 * Update email notification preferences
 */
router.post('/preferences', async (req, res) => {
    try {
        const userId = req.userId;
        const { emailAlerts, alertSeverity, dailySummary } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update preferences
        if (!user.preferences) {
            user.preferences = {};
        }

        user.preferences.emailAlerts = emailAlerts !== undefined ? emailAlerts : true;
        user.preferences.alertSeverity = alertSeverity || ['critical', 'high', 'medium'];
        user.preferences.dailySummary = dailySummary !== undefined ? dailySummary : false;

        await user.save();

        res.json({
            success: true,
            message: 'Email preferences updated',
            preferences: user.preferences
        });

    } catch (error) {
        console.error('Preferences update error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/email/preferences
 * Get email notification preferences
 */
router.get('/preferences', async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const preferences = user.preferences || {
            emailAlerts: true,
            alertSeverity: ['critical', 'high', 'medium'],
            dailySummary: false
        };

        res.json({
            success: true,
            preferences
        });

    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/email/trigger-daily-summary
 * Manually trigger daily summary emails (for testing)
 */
router.post('/trigger-daily-summary', async (req, res) => {
    try {
        console.log('📧 Manual trigger for daily summaries requested');
        const result = await triggerDailySummaryNow();
        
        res.json(result);
    } catch (error) {
        console.error('Trigger daily summary error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
