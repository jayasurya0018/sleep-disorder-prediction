/**
 * Error Handler Middleware
 * Centralized error handling with structured logging
 */

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log errors
  const logEntry = {
    timestamp: new Date().toISOString(),
    status,
    message,
    path: req.path,
    method: req.method,
    userId: req.userId || 'anonymous',
    ip: req.ip,
    ...(isDev && { stack: err.stack })
  };

  console.error(JSON.stringify(logEntry));

  // Don't expose sensitive details in production
  const clientMessage = isDev ? message : 'An error occurred';

  res.status(status).json({
    error: {
      status,
      message: clientMessage,
      ...(isDev && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
