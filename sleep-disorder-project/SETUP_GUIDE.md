# Advanced Features Setup & Integration Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd sleep-disorder-project/server
npm install pdfkit json2csv nodemailer
```

### 2. Start Services
```bash
# Terminal 1: Backend
cd server && npm start

# Terminal 2: Frontend
cd client && npm start

# Terminal 3: ML Service (optional)
cd ml && python realtime_app.py
```

### 3. Access Dashboard
Open browser to: `http://localhost:3000`

---

## Feature Setup

### Feature 1: Wearable Device Integration

#### Prerequisites
- Active Fitbit, Oura, or Garmin account
- API credentials from each device provider

#### Setup Steps

**1. Get Fitbit OAuth Token**
- Visit: https://dev.fitbit.com
- Create a new OAuth 2.0 application
- Set redirect URI to: `http://localhost:3000/oauth/fitbit`
- Note your Client ID and Client Secret

**2. Get Oura Token**
- Visit: https://cloud.ouraring.com
- Navigate to Personal Access Tokens
- Create new token
- Copy the 40-character personal access token

**3. Get Garmin API Key**
- Visit: https://developer.garmin.com
- Create API project
- Generate API key
- Configure permissions for health/sleep data

#### Usage in UI
1. Navigate to **Devices** in navbar
2. For each device:
   - Paste your access token
   - Click **Connect**
   - Status will show as "● Connected"
3. Click **Start Streaming** to begin real-time data collection

#### API Testing
```bash
curl -X POST http://localhost:5000/api/wearable/connect/fitbit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"accessToken":"YOUR_FITBIT_TOKEN"}'
```

---

### Feature 2: Data Export (CSV/PDF)

#### Setup (No additional configuration needed)

All required dependencies are pre-installed:
- `json2csv`: CSV generation
- `pdfkit`: PDF creation

#### Usage in UI
1. Navigate to **Export** in navbar
2. Select start and end dates
3. Choose format:
   - **CSV**: For Excel/Google Sheets analysis
   - **PDF**: Professional report with charts
4. Click **Export Data**
5. File downloads automatically

#### CSV Export Includes
- Date and sleep metrics
- Heart rate averages
- Sleep stage percentages (REM, Deep, Light)
- Alert count per day
- Statistical summary

#### PDF Export Includes
- Cover page with date range
- Executive summary
- Sleep quality trends
- Heart rate analysis
- Daily breakdown table
- Sleep stage distribution
- Alert log
- Personalized recommendations

#### API Testing
```bash
curl -X POST http://localhost:5000/api/export/csv \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-12-05T23:59:59.999Z"
  }' \
  -o sleep-data.csv
```

---

### Feature 3: Email Alerts & Notifications

#### Prerequisites
- Gmail account (recommended)
- Gmail App Password (not regular password)

#### Setup Steps

**1. Generate Gmail App Password**
- Enable 2-Factor Authentication: https://myaccount.google.com/security
- Go to: https://myaccount.google.com/apppasswords
- Select "Mail" and "Windows Computer"
- Google generates a 16-character password
- **Copy this password** (you'll need it)

**2. Configure Environment Variables**
Create `.env` file in `sleep-disorder-project/server/`:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**3. Restart Backend**
```bash
cd server
npm start
```

**4. Test Email Delivery**
```bash
node quick-test.js
```

#### Usage in UI
1. Navigate to **Alerts** in navbar
2. Enter your email address
3. Configure preferences:
   - **Alert Notifications**: Immediate alerts for sleep issues
   - **Daily Summary**: Schedule daily email report
   - **Severity Threshold**: 
     - Critical Only: Only critical issues
     - High & Critical: High-priority issues
     - Moderate & Above: Most issues (default)
     - All Alerts: Every notification
4. Click **Save Settings**
5. Click **Send Test Email** to verify

#### Alert Email Example
```
Subject: 🚨 Sleep Quality Alert - High Heart Rate Detected

Sleep Issue Detected:
├─ Type: Elevated Heart Rate
├─ Severity: HIGH
├─ Time: 3:45 AM
├─ Heart Rate: 98 bpm (Normal: 60-80)
└─ Duration: 15 minutes

Current Sleep Status:
├─ Sleep Quality: 72%
├─ Duration: 6.5 hours
├─ REM Sleep: 18%
└─ Deep Sleep: 20%

Recommendations:
✓ Check room temperature
✓ Avoid caffeine 6 hours before bed
✓ Try relaxation techniques
```

#### Using Alternative Email Providers

**Office 365:**
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_SMTP_HOST=smtp.office365.com
EMAIL_SMTP_PORT=587
```

**SendGrid:**
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
```

---

### Feature 4: Real-time Streaming

#### Architecture
```
Wearable Device → Backend Service → WebSocket → Frontend Dashboard
                 ↓
            MongoDB (Historical)
```

#### How It Works
1. Backend connects to wearable APIs (Fitbit, Oura, Garmin)
2. Data polled every 30 seconds by default
3. WebSocket broadcasts updates to all connected clients
4. Frontend displays live graphs and alerts
5. Data stored in MongoDB for historical analysis

#### Configuration
File: `sleep-disorder-project/server/services/wearableService.js`

```javascript
// Polling intervals (in milliseconds)
const POLLING_INTERVALS = {
  fitbit: 30000,    // 30 seconds
  oura: 60000,      // 1 minute
  garmin: 45000     // 45 seconds
};

// Data retention (in days)
const DATA_RETENTION = 365;

// Connection timeout (in seconds)
const CONNECTION_TIMEOUT = 30;
```

#### Usage in Frontend
```javascript
// React Hook for live data
function useLiveData() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/ws');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'data-update') {
        setData(message.data);
      }
    };

    return () => ws.close();
  }, []);

  return data;
}
```

#### Monitoring Live Data
1. Open Dashboard
2. Navigate to **Live Monitor**
3. Charts update in real-time
4. See current heart rate, sleep stage, alerts

#### Troubleshooting WebSocket
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => console.log('Connected');
ws.onerror = (err) => console.error('Error:', err);
ws.onclose = () => console.log('Disconnected');

// Monitor connection
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('WebSocket: Connected ✓');
  } else {
    console.log('WebSocket: Disconnected ✗');
  }
}, 5000);
```

---

## Environment Configuration

### Complete .env File Template

```env
# =========================
# Server Configuration
# =========================
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sleep_disorder

# =========================
# Email Configuration
# =========================
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_FROM_NAME=Sleep Disorder Monitoring

# =========================
# Wearable Device APIs
# =========================
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
FITBIT_REDIRECT_URI=http://localhost:3000/oauth/fitbit

OURA_API_KEY=your_oura_personal_token
OURA_API_URL=https://api.ouraring.com/v2

GARMIN_CLIENT_ID=your_garmin_client_id
GARMIN_CLIENT_SECRET=your_garmin_client_secret
GARMIN_API_URL=https://apis.garmin.com

# =========================
# JWT Configuration
# =========================
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# =========================
# File Upload Configuration
# =========================
MAX_EXPORT_FILE_SIZE=52428800
EXPORT_TEMP_DIR=./exports
```

---

## Testing

### Run Feature Test Suite
```bash
cd server
node test-features.js
```

Expected output:
```
╔════════════════════════════════════════╗
║  Sleep Disorder Monitoring System  ║
║      Feature Test Suite v1.0       ║
╚════════════════════════════════════════╝

=== TEST 1: Wearable Device Integration ===
✓ Wearable status endpoint working
✓ Fitbit connection endpoint responding

=== TEST 2: Data Export (CSV/PDF) ===
✓ Export available data endpoint responding
✓ CSV export endpoint responding
✓ PDF export endpoint responding

=== TEST 3: Email Alerts & Notifications ===
✓ Email test endpoint responding
✓ Email preferences endpoint responding

=== TEST 4: Real-time Streaming ===
✓ WebSocket connection established
✓ Real-time streaming connection working

╔════════════════════════════════════════╗
║           Test Summary                ║
╚════════════════════════════════════════╝

1. Wearable Devices:     ✓ PASS
2. Data Export:          ✓ PASS
3. Email Alerts:         ✓ PASS
4. Real-time Streaming:  ✓ PASS

4/4 tests passed

🎉 All systems operational!
```

### Manual API Testing

```bash
# Test wearable endpoint
curl -X GET http://localhost:5000/api/wearable/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test export endpoint
curl -X POST http://localhost:5000/api/export/csv \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"startDate":"2025-11-01T00:00:00Z","endDate":"2025-12-05T23:59:59Z"}'

# Test email endpoint
curl -X POST http://localhost:5000/api/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email":"test@example.com"}'
```

---

## Troubleshooting

### Common Issues & Solutions

**"Cannot find module 'pdfkit'"**
```bash
cd server
npm install pdfkit
```

**"Email not sending"**
- Verify Gmail app password is correct
- Check if 2FA is enabled on Gmail
- Verify EMAIL_USER in .env file
- Restart server after changing .env

**"WebSocket connection failed"**
- Ensure backend is running on port 5000
- Check firewall settings
- Verify browser console for errors

**"Wearable device won't connect"**
- Verify access token is correct and not expired
- Check network connectivity
- Try with test token first

**"Export taking too long"**
- Reduce date range
- Check available disk space
- Restart server
- Check MongoDB connection

**"Certificate errors on Windows"**
- Some APIs may need SSL certificates
- Add to .env: `NODE_TLS_REJECT_UNAUTHORIZED=0` (development only)

---

## Performance Optimization

### Database Indexing
```javascript
// Ensure these indexes exist for performance
db.sleepData.createIndex({ userId: 1, timestamp: -1 });
db.sleepData.createIndex({ userId: 1, severity: 1 });
db.emailPreferences.createIndex({ userId: 1 });
db.wearableDevices.createIndex({ userId: 1 });
```

### WebSocket Optimization
```javascript
// In server/websocket.js
const BATCH_INTERVAL = 5000;  // Send updates every 5 seconds
const MAX_CLIENTS = 100;       // Connection limit
const MESSAGE_BUFFER = 50;     // Store last 50 messages
```

### Export Optimization
```javascript
// Stream large exports instead of loading into memory
const stream = fs.createReadStream(filePath);
stream.pipe(res);
```

---

## Scaling Considerations

For production deployment:

1. **Database**: Switch to MongoDB Atlas or managed cluster
2. **Email**: Use SendGrid or AWS SES for higher volume
3. **Wearable APIs**: Implement caching to reduce API calls
4. **WebSocket**: Use clustering with Redis for multiple servers
5. **Storage**: Move exports to S3 or cloud storage
6. **Monitoring**: Add application performance monitoring (APM)

---

## Security Best Practices

1. **Never commit .env files to Git**
2. **Use HTTPS in production**
3. **Rotate JWT secrets regularly**
4. **Rate limit API endpoints**
5. **Sanitize all user inputs**
6. **Validate file uploads**
7. **Use CORS properly**
8. **Implement request logging**
9. **Keep dependencies updated**
10. **Use environment-specific configs**

---

## Next Steps

1. ✅ Configure wearable device credentials
2. ✅ Set up email notifications
3. ✅ Run test suite to verify all features
4. ✅ Connect your first wearable device
5. ✅ Export your first sleep report
6. ✅ Enable daily email summaries
7. ✅ Monitor real-time data on dashboard

---

## Support & Resources

- **Documentation**: `/ADVANCED_FEATURES_API.md`
- **Test Suite**: `server/test-features.js`
- **Example Token**: `server/get-token.js`
- **Logs**: Check browser console and server terminal

---

## Version Information

- **Release**: v2.0
- **Date**: December 5, 2025
- **Features**: 4 Advanced Integrations
- **Status**: Production Ready
