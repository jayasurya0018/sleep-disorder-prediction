# 🆓 FREE DEPLOYMENT GUIDE

**Status:** Complete Free Options Available  
**Date:** February 9, 2026  
**Cost:** $0 (Totally Free)  

---

## Free Hosting Options

### Frontend (Client) - Completely Free

#### Option 1: Vercel (Recommended - Easiest)
**Cost:** FREE  
**Features:** Unlimited deployments, auto-scaling, edge functions, SSL included  
**Performance:** Fast CDN, sub-100ms latency

**Deploy in 3 steps:**
```bash
# 1. Create account at vercel.com (free)
# 2. Build client
cd client && npm run build

# 3. Install Vercel CLI
npm i -g vercel

# 4. Deploy
vercel --prod

# Done! Your app is live at vercel app name.vercel.app
```

**Environment variables on Vercel:**
```
REACT_APP_API_URL=https://your-api-domain.com
```

---

#### Option 2: Netlify (Also Free)
**Cost:** FREE  
**Features:** Unlimited deployments, serverless functions, SSL included

**Deploy:**
```bash
# 1. Create account at netlify.com
# 2. Connect GitHub repo
# 3. Auto-deploys on git push
# OR manually: netlify deploy --prod --dir=client/build
```

---

#### Option 3: GitHub Pages (Free but Limited)
**Cost:** FREE  
**Features:** Static hosting only, auto-deploy from git
**Limitation:** Can't proxy API calls directly

```bash
# Add to client/package.json:
"homepage": "https://yourusername.github.io/repo-name"

# Deploy
npm run build
gh-pages -d build
```

---

### Backend (Server) - Free Options

#### Option 1: Render (RESTful APIs) - RECOMMENDED
**Cost:** FREE tier available  
**Features:** 750 free hours/month, auto-scaling, PostgreSQL/MongoDB support  
**URL:** render.com

**Deploy in 5 minutes:**

```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to render.com, sign up with GitHub

# 3. Create New → Web Service
   - Connect GitHub repo (sleep-disorder-project)
   - Name: sleep-api
   - Environment: Node
   - Build: npm install
   - Start: npm start
   - Region: Choose closest to you

# 4. Set Environment Variables
   In Render Dashboard:
   - PORT: 5000
   - NODE_ENV: production
   - MONGO_URI: (see MongoDB Atlas section)
   - JWT_SECRET: your_secret_32_chars_min
   - CLIENT_URL: https://your-vercel-domain.vercel.app
   - EMAIL_USER: your-email@gmail.com
   - EMAIL_PASSWORD: app_password

# 5. Deploy button → Done!
```

**Your API URL:** https://sleep-api.onrender.com (auto-generated)

---

#### Option 2: Railway (Very Easy)
**Cost:** FREE $5/month credit (enough for hobby projects)  
**Features:** PostgreSQL, Redis, MongoDB support, easy deploy

**Deploy:**
```bash
# 1. Go to railway.app
# 2. Sign in with GitHub
# 3. New Project → Deploy from GitHub repo
# 4. Select sleep-disorder-project repo
# 5. Add variables:
   PORT=5000
   NODE_ENV=production
   MONGO_URI=...
   JWT_SECRET=...
   etc.
# 6. Domain auto-generated, deploy starts automatically
```

---

#### Option 3: Heroku (Free Tier Removed - Not Recommended)
**Cost:** Paid (no free tier anymore)  
**Status:** Skip this option - use Render or Railway instead

---

#### Option 4: Replit (Quick & Easy)
**Cost:** FREE  
**Storage:** Limited (100MB)  
**Perfect for:** Quick testing

```bash
# 1. Go to replit.com
# 2. Import from GitHub
# 3. Select sleep-disorder-project
# 4. Add .env variables
# 5. Run → instant deployment with auto URL
```

---

### Database - Completely Free

#### MongoDB Atlas (Best Option - FREE Forever)
**Cost:** FREE tier - 512MB storage (enough for development)  
**Features:** Managed cloud MongoDB, automatic backups, 99.9% uptime

**Setup (10 minutes):**

```bash
# 1. Go to mongodb.com/cloud/atlas
# 2. Sign up (free)
# 3. Create Organization
# 4. Create Project
# 5. Create Cluster
   - Select AWS
   - Region: Choose closest to you
   - Cluster tier: Free (M0 Sandbox)
   - Click "Create"

# 6. Create Database User
   - Username: admin
   - Password: generate strong password
   - Save credentials safely

# 7. Network Access
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (0.0.0.0/0)
   - Click "Confirm"

# 8. Get Connection String
   - Click "Connect"
   - Select "Connect your application"
   - Copy connection string:
     mongodb+srv://admin:password@cluster0.xxxxx.mongodb.net/sleepdb?retryWrites=true&w=majority

# 9. Use as MONGO_URI in .env:
   MONGO_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sleepdb
```

---

#### Alternative: Firebase Realtime Database (Also Free)
**Cost:** FREE (limited)  
**Features:** Real-time database, authentication, hosting
**Limitation:** Need to modify code to use Firebase SDK

---

### Email Service - Free Options

#### Gmail (What you already have)
**Cost:** FREE  
**Features:** SMTP support, rate limit-friendly

Already configured! Just use:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

#### SendGrid (Free)
**Cost:** FREE tier - 100 emails/day  
**Perfect for:** Low-volume email apps

```bash
# 1. Go to sendgrid.com
# 2. Sign up (free)
# 3. Get API key
# 4. Update emailService.js to use SendGrid SMTP
```

---

#### Mailgun (Free)
**Cost:** FREE - up to 5000 emails/month  
**Features:** Excellent SMTP, reliable delivery

```bash
# 1. Go to mailgun.com
# 2. Sign up (free)
# 3. Get SMTP credentials
```

---

## Complete Free Stack Setup

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                     YOUR USERS                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
        ┌────────────────────────────────────┐
        │      VERCEL (Frontend)             │  FREE ✅
        │  your-app.vercel.app               │
        │  (React SPA)                       │
        └────────────┬───────────────────────┘
                     │
                     ↓
        ┌────────────────────────────────────┐
        │    RENDER (Backend API)            │  FREE ✅
        │  sleep-api.onrender.com            │
        │  (Node.js/Express)                 │
        └────────────┬───────────────────────┘
                     │
                     ↓
        ┌────────────────────────────────────┐
        │   MONGODB ATLAS (Database)         │  FREE ✅
        │  cloud.mongodb.com                 │
        │  (512MB Cloud DB)                  │
        └────────────────────────────────────┘
```

---

## Step-by-Step Deployment (Pick This Path)

### Step 1: Deploy Database (5 minutes)

```bash
# Follow MongoDB Atlas setup above
# Get your MONGO_URI string
# Keep it safe - you'll need it

# Example MONGO_URI:
# mongodb+srv://admin:mypassword@cluster0.abc123.mongodb.net/sleepdb
```

### Step 2: Deploy Backend to Render (10 minutes)

```bash
# 1. Push code to GitHub
cd sleep-disorder-project
git add .
git commit -m "Production ready"
git push origin main

# 2. Go to render.com
# 3. Sign in with GitHub account
# 4. Click "New +" → Web Service
# 5. Select your GitHub repo
# 6. Configure:
   Name: sleep-api
   Environment: Node
   Build Command: npm install
   Start Command: cd server && npm install --production && npm start
   Region: Singapore (closest to Asia) or US (closest to Americas)

# 7. Add Environment Variables (in Render dashboard):
   PORT: 5000
   NODE_ENV: production
   MONGO_URI: mongodb+srv://admin:password@cluster0...
   JWT_SECRET: your_very_secure_secret_minimum_32_characters_1234567890
   CLIENT_URL: https://your-app.vercel.app
   EMAIL_USER: your-email@gmail.com
   EMAIL_PASSWORD: your_app_password
   DASHBOARD_URL: https://your-app.vercel.app/dashboard

# 8. Deploy!
# Render will build and deploy automatically
# You'll get a URL: https://sleep-api.onrender.com
```

### Step 3: Deploy Frontend to Vercel (5 minutes)

```bash
# 1. Build client
cd client
npm run build

# 2. Install Vercel CLI
npm install -g vercel

# 3. Deploy
vercel --prod

# 4. Configure environment variable
# In Vercel dashboard → Settings → Environment Variables:
   REACT_APP_API_URL: https://sleep-api.onrender.com

# 5. Done!
# Your app is live at: your-project.vercel.app
```

### Step 4: Connect Frontend to Backend

Update `client/src/api.js`:

```javascript
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'https://sleep-api.onrender.com'
});
```

---

## Verification Commands

```bash
# Test database connection
curl https://sleep-api.onrender.com/health

# Test login
curl -X POST https://sleep-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test email
curl -X POST https://sleep-api.onrender.com/api/email/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail":"your-email@gmail.com"}'
```

---

## Important Limitations & Considerations

### Render Free Tier
✅ **Included:**
- 750 free hours/month (= full-time deployment for 1 service)
- Auto-scaling
- SSL certificate
- GitHub integration
- Environment variables

⚠️ **Limitations:**
- Spins down after 15 minutes of inactivity (takes ~30 sec to wake up)
- 512MB RAM
- No background workers for heavy tasks
- Limited to 100 requests/minute

**Note:** For sleep disorder app with scheduled emails, this is fine. Emails send from cron job, not user request.

---

### Vercel Free Tier
✅ **Included:**
- Unlimited deployments
- Edge network (fast CDN)
- SSL certificate
- GitHub auto-deploy

⚠️ **Limitations:**
- Limited to static hosting
- Must build client before deploying

---

### MongoDB Atlas Free Tier
✅ **Included:**
- 512MB storage (enough for ~50k records)
- Automatic backups
- 99.9% uptime
- Shared cluster (safe)

⚠️ **Limitations:**
- No SSL by default (but included with Atlas)
- Limited connection pools
- No backup download (automatic only)

---

## Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Frontend (Vercel) | Unlimited | $0 |
| Backend (Render) | 750 hrs/mo | $0 |
| Database (MongoDB Atlas) | 512MB | $0 |
| Email (Gmail) | Limited | $0 |
| **TOTAL** | | **$0** |

**Total Annual Cost: $0** 💰

---

## When to Upgrade (Optional)

- Users > 100,000/month → Consider Vercel Pro ($20/mo)
- Backend needs 24/7 uptime → Consider Render Paid ($7/mo)
- Database > 2GB → Consider MongoDB Paid ($57/mo)
- Custom domain → Namecheap ($0.88-12/yr)

---

## Troubleshooting Free Deployments

### Render Service Goes to Sleep
**Problem:** API slow to respond on first request  
**Solution:** Upgrade to paid plan ($7/mo) OR accept 30-second startup time

**Workaround:**
```javascript
// Add health check endpoint - keeps service awake
setInterval(() => {
  fetch('https://sleep-api.onrender.com/health')
}, 5 * 60 * 1000) // Every 5 minutes
```

---

### Database Connection Timeout
**Problem:** Can't connect to MongoDB Atlas  
**Solution:** 
```bash
# Check:
1. IP address whitelisted (0.0.0.0/0)
2. Username/password correct
3. Database name in URI (e.g., /sleepdb)
4. Network connectivity from Render
```

---

### Vercel Environment Variables Not Working
**Problem:** REACT_APP_API_URL undefined  
**Solution:**
```bash
# Must restart deployment after adding variables:
# In Vercel Dashboard → Deployments → Redeploy
```

---

## Summary: Your Free Stack

| Component | Platform | URL | Cost |
|-----------|----------|-----|------|
| Frontend | Vercel | your-app.vercel.app | $0 |
| Backend | Render | sleep-api.onrender.com | $0 |
| Database | MongoDB Atlas | cloud.mongodb.com | $0 |
| Email | Gmail | smtp.gmail.com | $0 |
| Domain | (Optional) | yourdomain.com | $0-12/yr |

**Total: $0/month** 🎉

---

## Quick Start - Do This Now

1. **Push to GitHub**
   ```bash
   git add . && git commit -m "Ready for deployment" && git push
   ```

2. **Setup MongoDB**
   - Go to mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

3. **Deploy Backend**
   - Go to render.com
   - Sign in with GitHub
   - Create Web Service
   - Add environment variables
   - Deploy (takes 2-3 minutes)

4. **Deploy Frontend**
   ```bash
   npm install -g vercel
   cd client && npm run build
   vercel --prod
   ```

5. **Done!** 🚀
   - Frontend: your-app.vercel.app
   - Backend: sleep-api.onrender.com

---

## References

- **Vercel**: vercel.com/docs
- **Render**: render.com/docs
- **MongoDB Atlas**: mongodb.com/cloud/atlas
- **GitHub**: github.com

---

**You now have a completely free, production-ready deployment!** 🎉

All services are reliable for hobby/startup projects with free tiers large enough for early stage users.
