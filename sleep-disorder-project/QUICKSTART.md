# 🚀 Quick Start Guide - Real-Time Features

## Installation (60 seconds)

### Windows Users:
```cmd
cd "C:\Users\Jayas\PROJECT WEBSITE\sleep-disorder-project"
install-realtime.bat
```

### Linux/Mac Users:
```bash
cd /path/to/PROJECT\ WEBSITE/sleep-disorder-project
chmod +x install-realtime.sh
./install-realtime.sh
```

---

## Starting the Application (3 Terminals)

### Terminal 1: Backend Server
```bash
cd sleep-disorder-project/server
npm start
```
**Output:** `Server running on 5000` + `WebSocket available at ws://localhost:5000/ws`

### Terminal 2: ML Service
```bash
cd sleep-disorder-project/ml
python realtime_app.py
```
**Output:** `Starting Real-Time ML Inference Service...` + `Running on http://0.0.0.0:5002`

### Terminal 3: Frontend
```bash
cd sleep-disorder-project/client
npm start
```
**Output:** `Compiled successfully!` + Opens browser at `http://localhost:3000`

---

## Using the Live Monitor

### Step 1: Login
- Go to http://localhost:3000
- Login with your credentials
- You'll receive a JWT token automatically

### Step 2: Navigate to Live Monitoring
- Click **"Live Monitor"** in the navbar
- Or go directly to: http://localhost:3000/live-monitoring

### Step 3: Connect WebSocket
- Click the **"Connect"** button
- Status should change to: 🟢 "Connected - Live monitoring active"

### Step 4: Simulate Data
- Click **"Simulate Data"** button
- Watch the charts update in real-time
- Check alerts panel for any anomalies

### Step 5: View Results
- **Current Values**: Shows latest readings
- **Charts**: Real-time line charts for all metrics
- **Alerts**: Critical notifications
- **Anomalies**: Statistical outliers detected

---

## Testing WebSocket (Optional)

```bash
cd sleep-disorder-project/server
node test-websocket.js
```

**Enter your JWT token when prompted**

Commands:
- `send` - Send random data
- `test` - Run all test scenarios
- `ping` - Check connection
- `help` - Show all commands
- `quit` - Exit

---

## Real-World Wearable Integration

### Example: Connecting Fitbit

```javascript
// In your frontend or mobile app
const streamFitbitData = async () => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  const ws = new WebSocket(`ws://localhost:5000/ws?token=${token}`);
  
  ws.onopen = async () => {
    // Fetch from Fitbit API
    const fitbitData = await fetch('https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json');
    const json = await fitbitData.json();
    
    // Stream to our system
    ws.send(JSON.stringify({
      type: 'stream',
      payload: {
        hrv: json.heartRateVariability,
        blood_oxygen: json.spo2,
        movement: json.steps,
        breathing: json.breathingRate,
        sleepStage: json.sleepStage
      }
    }));
  };
};
```

---

## Troubleshooting

### "WebSocket connection failed"
**Solution:** 
1. Check that backend server is running on port 5000
2. Verify you're logged in and have a valid token
3. Check browser console for error details

### "Analysis taking too long"
**Solution:**
1. Use `/predict/realtime` endpoint for faster inference
2. Check that ML service is running on port 5002
3. Reduce chart data points in LiveMonitoring.js (change `maxDataPoints`)

### "Charts not updating"
**Solution:**
1. Verify WebSocket connection is green
2. Click "Simulate Data" to test
3. Check Network tab in browser DevTools for WebSocket messages

### "Port already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

---

## API Quick Reference

### WebSocket Messages (Client → Server)

**Stream Data:**
```json
{
  "type": "stream",
  "payload": {
    "hrv": 55.5,
    "blood_oxygen": 96.2,
    "movement": 2.1,
    "breathing": 14,
    "sleepStage": "Deep"
  }
}
```

**Subscribe to Updates:**
```json
{
  "type": "subscribe",
  "payload": {
    "channels": ["all"]
  }
}
```

### HTTP Endpoints

**Get Real-time Stats:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/stream/stats
```

**Clear Buffer:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/stream/clear
```

**ML Prediction:**
```bash
curl -X POST http://localhost:5002/predict/realtime \
  -H "Content-Type: application/json" \
  -d '{
    "hrv": 55,
    "blood_oxygen": 96,
    "movement": 2,
    "breathing": 14
  }'
```

---

## Performance Tips

### For Best Performance:
1. **Reduce Chart Data Points**: Change `maxDataPoints` from 50 to 30
2. **Disable Animations**: Set `animation: { duration: 0 }` in charts
3. **Use Fast Inference**: Call `/predict/realtime` instead of `/predict`
4. **Batch Updates**: Send data in batches instead of individual points
5. **Clear Buffer**: Periodically clear old data via `/api/stream/clear`

### Recommended Settings:
```javascript
// In LiveMonitoring.js
const maxDataPoints = 30;  // Instead of 50
const updateInterval = 1000; // Update every 1 second
```

---

## What's Next?

### Immediate Next Steps:
1. ✅ Test the live monitoring dashboard
2. ✅ Run WebSocket test scenarios
3. ✅ Simulate real-time data
4. ✅ Check anomaly detection

### Future Enhancements:
1. 📱 Build mobile app (React Native)
2. 🔔 Add push notifications (Firebase)
3. 💾 Persist streaming data to MongoDB
4. 📊 Add trend analysis and forecasting
5. ⚡ Deploy to cloud (AWS/Azure)
6. 🔐 Add two-factor authentication
7. 📧 Email alerts for critical conditions

---

## Support

### Documentation:
- 📖 **Full Guide**: `REALTIME_FEATURES.md`
- 📝 **Summary**: `REALTIME_SUMMARY.md`
- 🏗️ **Architecture**: `ARCHITECTURE_DIAGRAM.txt`

### Testing:
- 🧪 **WebSocket Test**: `server/test-websocket.js`
- 📊 **Dashboard**: http://localhost:3000/live-monitoring

### Files Created:
- `server/websocket.js` - WebSocket server
- `server/services/streamingService.js` - Data streaming
- `server/routes/streamRoutes.js` - API routes
- `ml/realtime_app.py` - ML inference service
- `client/src/pages/LiveMonitoring.js` - Dashboard

---

## Success Checklist

- [ ] All dependencies installed
- [ ] Backend server running on port 5000
- [ ] ML service running on port 5002
- [ ] Frontend accessible at http://localhost:3000
- [ ] Can login and get JWT token
- [ ] Live monitoring page loads
- [ ] WebSocket connects successfully (green status)
- [ ] Simulate data button works
- [ ] Charts update in real-time
- [ ] Alerts display properly
- [ ] Anomalies detected correctly

---

**🎉 Congratulations! Your real-time sleep disorder monitoring system is ready!**

Navigate to: **http://localhost:3000/live-monitoring**

---

**Last Updated:** December 4, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
