/**
 * Health Check Routes
 * Provides endpoints for monitoring and orchestration systems
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * GET /health
 * Lightweight health check for load balancers
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /health/deep
 * Comprehensive health check including database
 */
router.get('/health/deep', async (req, res) => {
  try {
    const checks = {
      api: { status: 'ok' },
      database: { status: 'unknown' }
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      checks.database.status = 'ok';
    } else {
      checks.database.status = 'fail';
      checks.database.reason = 'Not connected';
    }

    const isHealthy = Object.values(checks).every(c => c.status === 'ok');
    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/health/ready', (req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  res.status(isReady ? 200 : 503).json({
    ready: isReady
  });
});

module.exports = router;
