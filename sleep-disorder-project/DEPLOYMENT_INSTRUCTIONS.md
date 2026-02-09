# 🚀 Production Deployment Guide

**Last Updated:** February 9, 2026  
**Status:** ✅ PRODUCTION READY  

---

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- MongoDB running (Atlas or local)
- Gmail account for email service
- Domain name and SSL certificate

### Step 1: Setup Server Environment
```bash
cd sleep-disorder-project/server

# Copy production config
cp .env.production.example .env

# Edit .env with your production values
nano .env
```

**Required .env Variables:**
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/sleepdb
JWT_SECRET=your_very_secure_secret_minimum_32_characters_long
CLIENT_URL=https://yourdomain.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app_specific_password
DASHBOARD_URL=https://yourdomain.com
```

### Step 2: Deploy Server
```bash
# Install production dependencies only
npm install --production

# Verify environment
NODE_ENV=production node -e "require('dotenv').config(); console.log(require('./config/envValidator')() ? '✓ Config valid' : '✗ Config invalid')"

# Start production server
NODE_ENV=production npm start
```

### Step 3: Deploy Client
```bash
cd sleep-disorder-project/client

# Build optimized production bundle
npm run build

# Test build locally
npm install -g serve
serve -s build -l 3001

# Deploy /build folder to your hosting service
# See specific instructions below
```

### Step 4: Verify Deployment
```bash
# Test API health
curl https://yourdomain.com/health

# Test login endpoint
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Detailed Deployment Instructions

### Option A: Deploy to Heroku

#### Server Setup
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret
heroku config:set CLIENT_URL=https://your-app-name.herokuapp.com
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your_app_password

# Add Procfile in root
echo "web: cd server && npm install --production && npm start" > Procfile

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Client Setup (on Heroku)
```bash
# Option 1: Deploy from same app (uncommon)
# Option 2: Deploy to separate static hosting (recommended - see below)
```

---

### Option B: Deploy to Vercel (Client Only)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client directory
cd client

# Deploy
vercel deploy --prod

# Set environment variable
vercel env add REACT_APP_API_URL=https://your-api-domain.com
```

**Vercel Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "REACT_APP_API_URL": "@api_url"
  }
}
```

---

### Option C: Deploy to AWS (Full Stack)

#### Server on EC2
```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://fnm.io/install | bash
fnm install --cwd-version

# Clone repository
git clone https://github.com/yourusername/sleep-disorder.git
cd sleep-disorder/server

# Setup environment
cp .env.production.example .env
nano .env  # Edit with production values

# Install dependencies
npm install --production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start index.js --name "sleep-api"
pm2 save
pm2 startup

# Setup reverse proxy with nginx
sudo amazon-linux-extras install nginx -y
sudo systemctl start nginx

# Configure nginx
sudo nano /etc/nginx/conf.d/sleep-api.conf
```

**Nginx Configuration:**
```nginx
upstream api {
    server localhost:5000;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Client on S3 + CloudFront
```bash
# Build client
cd client && npm run build

# Create S3 bucket
aws s3 mb s3://sleep-disorder-ui --region us-east-1

# Upload build
aws s3 sync build/ s3://sleep-disorder-ui/ --delete

# Create CloudFront distribution pointing to S3
# Set custom domain and SSL certificate

# Update client API URL to point to API server
export REACT_APP_API_URL=https://api.yourdomain.com
npm run build
aws s3 sync build/ s3://sleep-disorder-ui/ --delete
```

---

### Option D: Deploy to DigitalOcean

#### Create Droplet
```bash
# Create Ubuntu 22.04 droplet (6GB RAM recommended)
# SSH into droplet

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB (or use Atlas)
sudo apt install -y mongodb-org
sudo systemctl start mongod

# Install Nginx
sudo apt install -y nginx
sudo systemctl start nginx

# Clone repo
git clone https://github.com/yourusername/sleep-disorder.git
cd sleep-disorder/server

# Setup environment
cp .env.production.example .env
nano .env

# Install dependencies
npm install --production

# Install and setup PM2
npm install -g pm2
pm2 start index.js --name "sleep-api"
pm2 startup
pm2 save

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d api.yourdomain.com
sudo certbot certonly --standalone -d yourdomain.com
```

#### Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/sleep-disorder

# Paste configuration
upstream sleep_api {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name api.yourdomain.com yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://sleep_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    root /var/www/sleep-disorder/client/build;
    index index.html;
    
    location / {
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass http://sleep_api;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Enable and restart
sudo ln -s /etc/nginx/sites-available/sleep-disorder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Option E: Deploy with Docker

**Dockerfile (Server):**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install --production

COPY server/ ./

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]
```

**Dockerfile (Client):**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  api:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - CLIENT_URL=${CLIENT_URL}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASSWORD=${EMAIL_PASSWORD}
    depends_on:
      - mongodb

  client:
    build: ./client
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=http://api:5000
    depends_on:
      - api

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}

volumes:
  mongodb_data:
```

**Deploy with Docker:**
```bash
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

---

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://yourdomain.com/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-02-09T...",
#   "database": "connected",
#   "uptime": 123
# }
```

### 2. Test Authentication
```bash
# Register
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "password":"TestPassword123"
  }'

# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPassword123"
  }'
```

### 3. Test Email Service
```bash
# Get auth token from login response, then:
curl -X POST https://yourdomain.com/api/email/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail":"your-email@example.com",
    "subject":"Test Email"
  }'
```

### 4. Performance Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test endpoint performance
ab -n 100 -c 10 https://yourdomain.com/health

# Expected: Response time < 200ms
```

### 5. Security Headers Check
```bash
curl -I https://yourdomain.com/health

# Look for:
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Strict-Transport-Security
```

---

## Monitoring & Maintenance

### Monitor Logs
```bash
# On server with PM2
pm2 logs sleep-api

# On server with systemd
journalctl -u sleep-api -f

# Docker
docker-compose logs -f api
```

### Monitor Performance
```bash
# CPU and Memory
pm2 monit

# MongoDB
db.serverStatus()
db.stats()
```

### Automated Backups
```bash
# Backup MongoDB to S3 daily (cron job)
0 2 * * * /path/to/backup-mongo.sh

# backup-mongo.sh:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGO_URI" --out="/backups/dump_$DATE"
aws s3 sync /backups/dump_$DATE s3://your-bucket/backups/
```

### SSL Certificate Renewal
```bash
# Automatic renewal with certbot
sudo certbot renew --quiet

# Add to crontab (runs automatically with certbot)
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

---

## Troubleshooting

### Server Won't Start
```bash
# Check Node.js is installed
node --version

# Check environment variables
cat server/.env

# Test MongoDB connection
mongo "$MONGO_URI"

# Check port is available
lsof -i :5000

# View errors
tail -100 server/logs/error.log
```

### Email Not Sending
```bash
# Verify Gmail credentials
gmail_app_password=$(grep EMAIL_PASSWORD server/.env)

# Test SMTP connection
telnet smtp.gmail.com 587

# Check email service logs
grep -i "email\|mail" server/logs/combined.log
```

### High Server Load
```bash
# Check CPU/Memory
top

# Check Node processes
ps aux | grep node

# Optimize with clustering in PM2
pm2 start index.js -i max  # Use all CPU cores

# Check database connections
db.currentOp()
```

### Client Page Not Loading
```bash
# Check if build folder exists
ls -la client/build

# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -100 /var/log/nginx/error.log

# Clear browser cache and hard refresh (Ctrl+Shift+R)
```

---

## Security Checklist

- [ ] SSL/TLS certificates installed and valid
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] SSH keys configured (no password login)
- [ ] Environment variables secured (.env not in git)
- [ ] Database password changed from default
- [ ] Rate limiting enabled and tested
- [ ] CORS configured for your domain only
- [ ] Regular security updates applied
- [ ] Backups automated and tested
- [ ] Monitoring and alerts configured
- [ ] DDoS protection enabled (Cloudflare)
- [ ] WAF rules configured

---

## Support & Documentation

- **API Docs**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Email Setup**: [EMAIL_INTEGRATION_GUIDE.md](EMAIL_INTEGRATION_GUIDE.md)
- **OAuth Setup**: [OAUTH2_SETUP_GUIDE.md](OAUTH2_SETUP_GUIDE.md)
- **Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)

---

**Deployment Complete! 🎉**

Your application is now live in production.
