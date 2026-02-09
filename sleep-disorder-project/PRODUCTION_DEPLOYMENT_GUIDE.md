# Production Deployment Checklist

## Pre-Deployment (72 hours before)

- [ ] Run `npm audit` and fix critical vulnerabilities
  ```bash
  cd server && npm audit
  cd ../client && npm audit
  ```

- [ ] Security review of new code
  - [ ] No hardcoded secrets
  - [ ] No debug logging in production paths
  - [ ] All inputs validated
  - [ ] No sensitive data in error messages

- [ ] Update .env.production with real values:
  - [ ] `JWT_SECRET` - Strong random 32+ char string
  - [ ] `MONGO_URI` - Production MongoDB (Atlas, managed, etc)
  - [ ] `FITBIT_CLIENT_ID/SECRET` - Real credentials
  - [ ] `EMAIL_USER/PASSWORD` - Production email service
  - [ ] `CLIENT_URL` - Production domain (HTTPS)

- [ ] Database preparation
  - [ ] Backup current data
  - [ ] Create production database
  - [ ] Test restore procedure
  - [ ] Create indexes on frequently queried fields

## Deployment Day (6 hours before)

- [ ] Final testing
  ```bash
  npm test  # Run full test suite
  npm audit --audit-level=moderate
  ```

- [ ] Build frontend for production
  ```bash
  cd client
  npm run build
  # Verify build output is <5MB gzipped
  ```

- [ ] Verify health checks respond
  ```bash
  curl http://localhost:5000/health
  curl http://localhost:5000/health/deep
  ```

- [ ] Load testing (optional)
  ```bash
  # Test with 10+ concurrent users
  # Monitor CPU, memory, database connections
  ```

## Deployment (Execution)

- [ ] Set environment variables (use secrets manager, not .env)
  ```bash
  export NODE_ENV=production
  export JWT_SECRET=...
  # (Or use systemd, Docker env, etc)
  ```

- [ ] Start backend
  ```bash
  cd server
  npm start
  # Verify server starts without errors
  # Check logs for "Health checks at http://..."
  ```

- [ ] Verify endpoints working
  ```bash
  curl https://yourdomain.com/api/auth/register
  curl https://yourdomain.com/health
  ```

- [ ] Test critical user flows
  - [ ] User registration & login
  - [ ] Wearable device connection (OAuth)
  - [ ] Data export (CSV/PDF)
  - [ ] Real-time streaming via WebSocket

- [ ] Monitor logs for 1 hour
  ```bash
  tail -f /var/log/sleep-disorder-app.log
  # Watch for errors, warnings, suspicious activity
  ```

## Post-Deployment

- [ ] Set up monitoring & alerting
  - [ ] Error rate > 1% alert
  - [ ] Response time > 5 seconds alert
  - [ ] Database connection pool exhaustion alert
  - [ ] Disk space < 10% alert

- [ ] Set up automated backups
  - [ ] Daily MongoDB backup to S3/Azure/GCS
  - [ ] Test restore from backup weekly
  - [ ] Retention policy: 30 days rolling

- [ ] Configure log aggregation
  - [ ] Centralize logs (Splunk, ELK, Datadog, etc)
  - [ ] Set up retention (60 days minimum)
  - [ ] Create dashboards for key metrics

- [ ] Set up uptime monitoring
  - [ ] External health checks every 5 minutes
  - [ ] Page on call if down > 5 minutes
  - [ ] Dashboard showing uptime SLA

## Rollback Plan (If needed)

- [ ] Have previous version ready
  ```bash
  git checkout previous-release-tag
  npm install
  ```

- [ ] Restore database from backup
  ```bash
  mongorestore --uri "mongodb://..." --archive=backup.archive
  ```

- [ ] Verify previous version working
  ```bash
  curl https://yourdomain.com/health
  ```

## Weekly Maintenance

- [ ] Review error logs for patterns
  - [ ] Fix recurring errors
  - [ ] Update error thresholds if needed

- [ ] Monitor security updates
  - [ ] Check npm advisory weekly
  - [ ] Apply patches within 48 hours for critical CVEs

- [ ] Review database performance
  - [ ] Slow query logs
  - [ ] Connection pool usage
  - [ ] Disk usage trends

- [ ] Backup verification
  - [ ] Test restore procedure
  - [ ] Verify backup size and integrity

## Monthly Review

- [ ] Performance metrics
  - [ ] API latency p99
  - [ ] Database query performance
  - [ ] WebSocket connection stability
  - [ ] OAuth error rate

- [ ] Capacity planning
  - [ ] Projected growth vs current limits
  - [ ] Database size trends
  - [ ] Concurrent user trends

- [ ] Security audit
  - [ ] Review CloudTrail/audit logs
  - [ ] Check for unauthorized access
  - [ ] Rotate secrets if needed

---

## Required Tools for Production

- [ ] Docker (or systemd for Linux)
- [ ] Nginx/HAProxy (reverse proxy with HTTPS)
- [ ] MongoDB Atlas or self-managed MongoDB
- [ ] SendGrid/AWS SES (email delivery)
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Log aggregation (ELK, Splunk, Datadog)
- [ ] Monitoring (Prometheus, Grafana, Datadog)
- [ ] Secrets manager (AWS Secrets Manager, Vault)
- [ ] CDN for static assets (CloudFlare, Fastly)

---

## Health Check Endpoints (for monitoring systems)

- `GET /health` - Lightweight check (200 = OK)
- `GET /health/deep` - Database + API check
- `GET /health/ready` - Kubernetes readiness

Example curl:
```bash
curl http://localhost:5000/health | jq .
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-09T...",
  "uptime": 3600
}
```

---

## Troubleshooting Production Issues

### "Cannot connect to database"
- [ ] Verify MONGO_URI is correct
- [ ] Check network connectivity
- [ ] Verify MongoDB credentials
- [ ] Check firewall rules

### "High error rate"
- [ ] Check logs: `tail -f /var/log/sleep-disorder-app.log`
- [ ] Check database: `mongosh <connection-string>`
- [ ] Restart service if memory leak suspected
- [ ] Check rate limits not being exceeded

### "WebSocket connections failing"
- [ ] Check WSS (HTTPS) is required in production
- [ ] Verify reverse proxy forwards Upgrade headers
- [ ] Check firewall allows WebSocket connections
- [ ] Verify JWT tokens not expired

### "Slow API responses"
- [ ] Check MongoDB slow query logs
- [ ] Check server CPU/memory (top, htop)
- [ ] Check network latency
- [ ] Review database indexes

---

*Last updated: February 9, 2026*
