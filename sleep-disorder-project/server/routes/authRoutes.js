const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Standard auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/user/profile', authMiddleware, authController.updateProfile);

// Fitbit OAuth2 scaffolding
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID || 'YOUR_CLIENT_ID';
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI || 'http://localhost:5001/api/auth/fitbit/callback';

// Start OAuth2 flow
router.get('/fitbit', (req, res) => {
	const scope = 'activity heartrate location nutrition profile settings sleep social weight oxygen_saturation';
	const url = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(FITBIT_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&expires_in=604800`;
	res.redirect(url);
});

// Handle OAuth2 callback
router.get('/fitbit/callback', async (req, res) => {
	const code = req.query.code;
	if (!code) return res.status(400).send('Missing code');
	// Exchange code for access token (scaffold only)
	// In production, use axios/fetch to POST to https://api.fitbit.com/oauth2/token
	// and store the access_token/refresh_token for the user
	res.send('Fitbit OAuth callback received! (Implement token exchange here)');
});

module.exports = router;