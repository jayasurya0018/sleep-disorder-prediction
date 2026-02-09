/**
 * OAuth2 Routes for Wearable Devices
 * Handles OAuth flow, token storage, and auto-refresh
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// OAuth2 Configurations
const OAUTH_CONFIGS = {
    fitbit: {
        authUrl: 'https://www.fitbit.com/oauth2/authorize',
        tokenUrl: 'https://api.fitbit.com/oauth2/token',
        clientId: process.env.FITBIT_CLIENT_ID,
        clientSecret: process.env.FITBIT_CLIENT_SECRET,
        scope: 'heartrate oxygen_saturation sleep activity profile',
        redirectUri: process.env.FITBIT_REDIRECT_URI || 'http://localhost:5000/api/oauth/callback/fitbit'
    },
    oura: {
        authUrl: 'https://cloud.ouraring.com/oauth/authorize',
        tokenUrl: 'https://api.ouraring.com/oauth/token',
        clientId: process.env.OURA_CLIENT_ID,
        clientSecret: process.env.OURA_CLIENT_SECRET,
        scope: 'daily heartrate workout sleep personal',
        redirectUri: process.env.OURA_REDIRECT_URI || 'http://localhost:5000/api/oauth/callback/oura'
    },
    garmin: {
        authUrl: 'https://connect.garmin.com/oauthConfirm',
        tokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
        clientId: process.env.GARMIN_CLIENT_ID,
        clientSecret: process.env.GARMIN_CLIENT_SECRET,
        scope: 'wellness activities',
        redirectUri: process.env.GARMIN_REDIRECT_URI || 'http://localhost:5000/api/oauth/callback/garmin'
    }
};

/**
 * GET /api/oauth/authorize/:device
 * Redirect user to device OAuth authorization page
 * NO AUTH REQUIRED - uses token in query param
 */
router.get('/authorize/:device', async (req, res) => {
    try {
        const { device } = req.params;
        const { token } = req.query;
        
        // Decode JWT token to get userId
        const jwt = require('jsonwebtoken');
        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch (error) {
            return res.status(401).redirect(`${process.env.CLIENT_URL}/wearable-devices?error=invalid_token`);
        }
        
        const config = OAUTH_CONFIGS[device];
        if (!config) {
            return res.status(400).json({ error: 'Unsupported device' });
        }

        // Build authorization URL
        const authUrl = new URL(config.authUrl);
        authUrl.searchParams.append('client_id', config.clientId);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', config.scope);
        authUrl.searchParams.append('redirect_uri', config.redirectUri);
        authUrl.searchParams.append('state', `${userId}:${device}`); // Pass userId in state

        // Redirect user to OAuth provider
        res.redirect(authUrl.toString());

    } catch (error) {
        console.error('Authorization error:', error);
        res.status(500).json({ error: 'Authorization failed' });
    }
});

/**
 * GET /api/oauth/callback/:device
 * Handle OAuth callback and exchange code for tokens
 */
router.get('/callback/:device', async (req, res) => {
    try {
        const { device } = req.params;
        const { code, state, error } = req.query;

        // Check for authorization error
        if (error) {
            return res.redirect(`${process.env.CLIENT_URL}/wearable-devices?error=${error}`);
        }

        if (!code || !state) {
            return res.redirect(`${process.env.CLIENT_URL}/wearable-devices?error=missing_code`);
        }

        // Extract userId from state
        const [userId, deviceFromState] = state.split(':');
        
        const config = OAUTH_CONFIGS[device];
        if (!config) {
            return res.redirect(`${process.env.CLIENT_URL}/wearable-devices?error=invalid_device`);
        }

        // Exchange authorization code for tokens
        const tokenResponse = await exchangeCodeForToken(device, code, config);

        // Store tokens in database
        await storeTokens(userId, device, tokenResponse);

        // Redirect back to frontend with success
        res.redirect(`${process.env.CLIENT_URL}/wearable-devices?success=${device}`);

    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/wearable-devices?error=token_exchange_failed`);
    }
});

/**
 * Exchange authorization code for access token and refresh token
 */
async function exchangeCodeForToken(device, code, config) {
    try {
        // Create Basic Auth header
        const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

        const response = await axios.post(
            config.tokenUrl,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: config.redirectUri
            }).toString(),
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return response.data;

    } catch (error) {
        console.error(`Token exchange error for ${device}:`, error.response?.data || error.message);
        throw new Error('Failed to exchange code for token');
    }
}

/**
 * Store OAuth tokens in database
 */
async function storeTokens(userId, device, tokenData) {
    try {
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

        await User.findByIdAndUpdate(
            userId,
            {
                [`wearableTokens.${device}`]: {
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expiresAt: expiresAt,
                    scope: tokenData.scope,
                    userId: tokenData.user_id,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        console.log(`Tokens stored for user ${userId}, device ${device}`);

    } catch (error) {
        console.error('Token storage error:', error);
        throw new Error('Failed to store tokens');
    }
}

/**
 * POST /api/oauth/refresh/:device
 * Refresh access token using refresh token
 */
router.post('/refresh/:device', authMiddleware, async (req, res) => {
    try {
        const { device } = req.params;
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user || !user.wearableTokens || !user.wearableTokens[device]) {
            return res.status(404).json({ error: 'No tokens found for this device' });
        }

        const tokens = user.wearableTokens[device];
        const config = OAUTH_CONFIGS[device];

        // Refresh the token
        const newTokens = await refreshAccessToken(device, tokens.refreshToken, config);

        // Update stored tokens
        await storeTokens(userId, device, newTokens);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            expiresIn: newTokens.expires_in
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(device, refreshToken, config) {
    try {
        const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

        const response = await axios.post(
            config.tokenUrl,
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }).toString(),
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return response.data;

    } catch (error) {
        console.error(`Token refresh error for ${device}:`, error.response?.data || error.message);
        throw new Error('Failed to refresh access token');
    }
}

/**
 * GET /api/oauth/status
 * Get OAuth connection status for all devices
 */
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select('wearableTokens');

        if (!user || !user.wearableTokens) {
            return res.json({ devices: {} });
        }

        const devices = {};
        for (const [device, tokens] of Object.entries(user.wearableTokens)) {
            devices[device] = {
                connected: true,
                expiresAt: tokens.expiresAt,
                scope: tokens.scope,
                isExpired: new Date() > new Date(tokens.expiresAt)
            };
        }

        res.json({ devices });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

/**
 * DELETE /api/oauth/disconnect/:device
 * Disconnect a device and remove tokens
 */
router.delete('/disconnect/:device', authMiddleware, async (req, res) => {
    try {
        const { device } = req.params;
        const userId = req.userId;

        await User.findByIdAndUpdate(
            userId,
            { [`$unset`]: { [`wearableTokens.${device}`]: 1 } }
        );

        res.json({
            success: true,
            message: `${device} disconnected successfully`
        });

    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: 'Failed to disconnect device' });
    }
});

/**
 * Middleware to get valid access token (auto-refresh if expired)
 */
async function getValidAccessToken(userId, device) {
    try {
        const user = await User.findById(userId);
        if (!user || !user.wearableTokens || !user.wearableTokens[device]) {
            throw new Error('Device not connected');
        }

        const tokens = user.wearableTokens[device];
        const now = new Date();
        const expiresAt = new Date(tokens.expiresAt);

        // If token expires in less than 5 minutes, refresh it
        if (expiresAt - now < 5 * 60 * 1000) {
            console.log(`Token expiring soon for ${device}, refreshing...`);
            const config = OAUTH_CONFIGS[device];
            const newTokens = await refreshAccessToken(device, tokens.refreshToken, config);
            await storeTokens(userId, device, newTokens);
            return newTokens.access_token;
        }

        return tokens.accessToken;

    } catch (error) {
        console.error('Error getting valid access token:', error);
        throw error;
    }
}

module.exports = router;
module.exports.getValidAccessToken = getValidAccessToken;
