# 🆓 FREE DEPLOYMENT - 15 MINUTE QUICK START

**Total Cost:** $0  
**Time:** 15 minutes  
**Difficulty:** Easy  

---

## Your Free Tech Stack

```
✅ Frontend Hosting: Vercel (FREE)          → your-app.vercel.app
✅ Backend Hosting: Render (FREE)           → sleep-api.onrender.com  
✅ Database: MongoDB Atlas (FREE 512MB)     → cloud.mongodb.com
✅ Email: Gmail (FREE)                      → Already have it!
```

---

## DO THIS NOW (3 Steps)

### STEP 1: Setup Database (5 minutes)

1. Go to **mongodb.com/cloud/atlas**
2. Click **Sign Up** (free)
3. Create Organization → Create Project
4. **Create Cluster:**
   - Select "AWS"
   - Choose "Free" tier (M0 Sandbox)
   - Click **Create**
5. **Create Database User:**
   - Username: `admin`
   - Password: Make strong password
   - **SAVE CREDENTIALS!**
6. **Network Access:**
   - Click "Add IP Address"
   - Select "Allow from anywhere"
   - Confirm
7. **Get Connection String:**
   - Click "Connect"
   - Select "Drivers"
   - Copy: `mongodb+srv://admin:PASSWORD@cluster0.xxx.mongodb.net/sleepdb?retryWrites=true&w=majority`
   - **KEEP THIS SAFE - YOU'LL NEED IT**

**Result:** `MONGO_URI=mongodb+srv://admin:yourpassword@cluster0...`

---

### STEP 2: Deploy Backend (5 minutes)

1. Go to **render.com**
2. Sign in with GitHub
3. Click **New** → **Web Service**
4. **Connect GitHub:**
   - Select `sleep-disorder-project` repo
   - Confirm
5. **Configure:**
   - Name: `sleep-api`
   - Environment: `Node`
   - Region: Choose closest to you
   - Build: `npm install`
   - Start: `cd server && npm install --production && npm start`
6. **Add Variables** (click "Advanced" → "Add Environment Variable"):

   ```
   PORT                  5000
   NODE_ENV              production
   MONGO_URI             mongodb+srv://admin:password@cluster0...
   JWT_SECRET            your_super_secret_minimum_32_char_password_here_1234567890abc
   CLIENT_URL            https://your-vercel-url.vercel.app
   EMAIL_USER            your-email@gmail.com
   EMAIL_PASSWORD        your_gmail_app_password
   DASHBOARD_URL         https://your-vercel-url.vercel.app/dashboard
   ```

7. Click **Deploy**
8. **Wait 2-3 minutes...**
9. You get a URL like: `https://sleep-api.onrender.com`

**Save your API URL: `https://sleep-api.onrender.com`**

---

### STEP 3: Deploy Frontend (5 minutes)

```bash
# 1. Build
cd client
npm run build

# 2. Install Vercel
npm install -g vercel

# 3. Deploy
vercel --prod

# Answer questions:
#   Vercel account: Sign in with GitHub
#   Project name: sleep-disorder
#   Link to existing project: No
#   Deploy: Yes

# You get a URL like: https://sleep-disorder.vercel.app
```

**That's it! You're live!** 🎉

Frontend: `https://sleep-disorder.vercel.app`  
Backend: `https://sleep-api.onrender.com`

---

## Verify It Works

```bash
# Test API is running
curl https://sleep-api.onrender.com/health

# Test register
curl -X POST https://sleep-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test123!"}'

# Test login
curl -X POST https://sleep-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

---

## ⚠️ Important Notes

### Render Free Tier Limitation
- **After 15 minutes of no requests** → Service goes to sleep
- **First request after sleep** → Takes 30 seconds to wake up
- **Not a problem for:** Email alerts, scheduled jobs, webhooks
- **Workaround:** Keep service awake with health check pings

### MongoDB Free Tier
- **512MB storage** - Enough for ~50,000 sleep records
- **No credit card required** to use free tier
- **Automatic daily backups**

### Vercel
- **Unlimited deploys** on free tier
- **Auto-redeploy** when you push to GitHub
- **CDN included** (fast worldwide)

---

## Later: Connect Frontend to Backend

Edit `client/src/api.js`:

```javascript
// Change:
const baseURL = 'http://localhost:5000'

// To:
const baseURL = 'https://sleep-api.onrender.com'

// Or use env variable:
const baseURL = process.env.REACT_APP_API_URL || 'https://sleep-api.onrender.com'
```

Then redeploy:
```bash
cd client && npm run build
vercel --prod
```

---

## What's Included in Free Tier?

✅ **Vercel Free**
- Unlimited projects
- Unlimited deployments
- Global CDN
- SSL certificate
- Custom domain support
- Environment variables

✅ **Render Free**
- 750 hours/month (24/7 for 1 app)
- Auto-scaling
- SSL certificate
- GitHub integration
- Environment variables
- Basic monitoring

✅ **MongoDB Atlas Free**
- 512MB storage
- Automatic backups
- 99.9% uptime
- Shared cluster (multi-tenant)
- Connection pooling
- Network access from anywhere

✅ **Gmail Free**
- SMTP support
- Rate limited but sufficient
- No setup needed (you have it!)

---

## Summary

| Service | Cost | Setup Time |
|---------|------|-----------|
| Vercel | FREE | 2 min |
| Render | FREE | 5 min |
| MongoDB | FREE | 5 min |
| Email | FREE | 1 min |
| **TOTAL** | **$0** | **15 min** |

---

## Troubleshooting

**API too slow?**
- It's normal on first request (waking from sleep)
- Add health check pings to keep it awake

**Can't connect to database?**
- Check MONGO_URI is correct
- Check IP is whitelisted (0.0.0.0/0)
- Check database user credentials

**Vercel shows blank page?**
- Check REACT_APP_API_URL environment variable
- Redeploy after setting variables

**Email not sending?**
- Check EMAIL_USER and EMAIL_PASSWORD are correct
- Try sending test email

---

## Next Steps (Optional Upgrades)

**Want better performance?**
- Render Pro: $7/month (always-on, no sleep)
- Vercel Pro: $20/month (advanced features)
- MongoDB Paid: $57/month (10GB storage)

**Want custom domain?**
- Buy from Namecheap: $0.88-12/year
- Connect to Vercel: Free
- Connect to Render: Free

---

## Your Deployment URLs

**Frontend:** https://_____.vercel.app  
**Backend:** https://_____.onrender.com  
**Database:** cloud.mongodb.com  
**Email:** gmail

**All FREE. All production-ready. Live now!** 🚀

---

**Need help?** See `FREE_DEPLOYMENT_GUIDE.md` for detailed instructions.

**Ready?** Start with STEP 1 above! ⬆️
