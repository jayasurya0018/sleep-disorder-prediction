/**
 * Request Logging Middleware
 * Logs all API requests with timing and response info
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous',
      ip: req.ip
    };

    // Only log non-sensitive paths in production
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev || duration > 5000 || res.statusCode >= 400) {
      console.log(JSON.stringify(logEntry));
    }

    res.send = originalSend;
    return res.send(data);
  };

  next();
};

module.exports = requestLogger;
