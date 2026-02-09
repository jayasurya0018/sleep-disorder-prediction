const rateLimit = (options = {}) => {
  const windowMs = Number(options.windowMs || process.env.RATE_LIMIT_WINDOW_MS || 60000);
  const max = Number(options.max || process.env.RATE_LIMIT_MAX || 120);
  const message = options.message || 'Too many requests, please try again later.';
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.connection?.remoteAddress || 'unknown';
    let entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'rate_limited', message });
    }

    next();
  };
};

module.exports = rateLimit;
