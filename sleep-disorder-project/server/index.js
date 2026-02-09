const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
require('./config');
const validateEnvironment = require('./config/envValidator');
const authMiddleware = require('./middleware/auth'); // Import from new file
const securityHeaders = require('./middleware/securityHeaders');
const rateLimit = require('./middleware/rateLimit');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { initializeWebSocket } = require('./websocket');
const { startDailySummaryJob } = require('./jobs/dailySummaryJob'); // Add scheduled jobs

// ======== STARTUP VALIDATION ========
console.log(`🚀 Starting server in ${process.env.NODE_ENV || 'development'} mode...`);
validateEnvironment();

const app = express();
const server = http.createServer(app);

// ======== MIDDLEWARE STACK ========
app.use(requestLogger);
app.use(cors({
	origin: process.env.CLIENT_URL || 'http://localhost:3000',
	credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(securityHeaders);
app.use('/api', rateLimit());

// ======== HEALTH CHECKS ========
app.use('/health', require('./routes/healthRoutes'));

// ======== API ROUTES ========

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/data', require('./routes/dataRoutes'));
app.use('/api/ml', authMiddleware, require('./routes/mlRoutes'));
app.use('/api/stream', authMiddleware, require('./routes/streamRoutes'));
app.use('/api/wearable', authMiddleware, require('./routes/wearableRoutes'));
app.use('/api/oauth', require('./routes/oauthRoutes')); // OAuth routes (auth handled per-route)
app.use('/api/export', authMiddleware, require('./routes/exportRoutes'));
app.use('/api/email', authMiddleware, require('./routes/emailRoutes'));

// ======== ERROR HANDLING ========
app.use(errorHandler);

// Initialize WebSocket server
initializeWebSocket(server);

const PORT = process.env.PORT || 5000;

// ======== GRACEFUL SHUTDOWN ========
const gracefulShutdown = () => {
	console.log('\n⏹️  Shutting down gracefully...');
	server.close(() => {
		console.log('✓ HTTP server closed');
		require('mongoose').disconnect(() => {
			console.log('✓ MongoDB disconnected');
			process.exit(0);
		});
	});
	// Force exit after 10 seconds
	setTimeout(() => {
		console.error('⚠️  Forced shutdown - still had open connections');
		process.exit(1);
	}, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

server.listen(PORT, () => {
	console.log(`✅ Server running on port ${PORT}`);
	console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws`);
	console.log(`🏥 Health checks at http://localhost:${PORT}/health`);
	
	// Start scheduled jobs
	startDailySummaryJob();
	console.log(`📧 Daily summary job scheduled for 8:00 AM every day`);
});