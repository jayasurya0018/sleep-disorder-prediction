# Quick Start - Real-Time Wearable Integration

## 🚀 Quick Run (5 minutes)

### Terminal 1 - Backend Server
```bash
cd "c:/Users/Jayas/PROJECT WEBSITE/sleep-disorder-project/server"
npm start
```
✅ Server ready on http://localhost:5000

### Terminal 2 - Frontend App
```bash
cd "c:/Users/Jayas/PROJECT WEBSITE/sleep-disorder-project/client"
npm start
```
✅ App opens at http://localhost:3000

## 📱 Test the Integration

### Step 1: Login
- Use your existing credentials to login
- (Or create a test account if needed)

### Step 2: Navigate to Wearable Devices
- Click "Connected Wearable Devices" in the menu
- You'll see three device options: Fitbit, Oura, Garmin

### Step 3: Connect a Device
**Option A: Test with Mock Data (No API Key Needed)**
- Enter any token (test123)
- Click "Connect" on any device
- It will simulate real data

**Option B: Real Device Connection**
- Get your API token from:
  - Fitbit: https://dev.fitbit.com
  - Oura: https://cloud.ouraring.com
  - Garmin: https://developer.garmin.com
- Enter your actual token
- Click "Connect"

### Step 4: Start Real-Time Streaming
- Click "Start Streaming" button
- Watch the live dashboard update every 5 seconds
- See metrics: HRV, Blood Oxygen, Movement, Breathing Rate, Sleep Stage

### Step 5: Monitor Live Data
Real-time metrics displayed:
- ❤️ Heart Rate Variability (HRV)
- 🫁 Blood Oxygen Level
- 🎯 Movement
- 🌬️ Breathing Rate
- 😴 Sleep Stage
- 📡 Data Source (Device)

## 🔧 How It Works

### Data Flow:
```
Wearable Device
    ↓
Backend API (Polls every 5s)
    ↓
WebSocket Server (Real-time broadcast)
    ↓
Frontend Dashboard (Live update)
    ↓
User sees live metrics
```

### New Features:
✅ **Server-side polling** - Backend actively fetches device data
✅ **WebSocket streaming** - Real-time data to all connected clients
✅ **Live dashboard** - Beautiful metrics display
✅ **Anomaly detection** - Alerts for abnormal readings
✅ **Data history** - Tracks last 50 readings

## 📊 Live Data Display

When streaming is active, you'll see:

```
┌─────────────────────────────────────────┐
│  📊 Live Wearable Data                  │
├─────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │ HRV  │ │ SpO2 │ │ Move │             │
│ │ 55ms │ │ 96%  │ │ 2.5  │             │
│ └──────┘ └──────┘ └──────┘             │
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │Breath│ │Stage │ │Source│             │
│ │  15  │ │ Deep │ │Fitbit│             │
│ └──────┘ └──────┘ └──────┘             │
│                                         │
│ Last 47 readings recorded              │
└─────────────────────────────────────────┘
```

## 🎯 Key Improvements Over Previous Version

### Before:
- Data had to be manually pushed from client
- No automatic polling
- Limited real-time capability
- Manual WebSocket message handling

### After:
- **Server actively polls** wearable devices every 5 seconds
- **Automatic data streaming** to connected clients
- **Live dashboard** with beautiful metrics display
- **Zero configuration** - just connect and start
- **Anomaly detection** with instant alerts
- **Data history** tracking
- **Support for 3 devices** - Fitbit, Oura, Garmin

## 💡 Testing Without Real Devices

The system includes mock data generators:

1. Enter any token (e.g., "test123" or "mock")
2. Connect the device
3. Click "Start Streaming"
4. Watch mock data update in real-time

Mock data simulates:
- Realistic vital signs
- Sleep stage transitions
- Normal daily variations
- Occasional anomalies for testing alerts

## 🔐 Security Features

- JWT token authentication on WebSocket
- Secure device token storage
- User-specific data isolation
- Expired token cleanup

## 📈 Monitoring in Real-Time

### Normal Reading Range:
- **HRV**: 40-100 ms (higher is better)
- **SpO2**: 95-100% (good), 90-94% (acceptable)
- **Breathing**: 12-20 breaths/min
- **Movement**: 0-3 (sleeping), >5 (active)

### Alert Triggers:
- SpO2 < 94% → ⚠️ Low oxygen warning
- SpO2 < 90% → 🚨 Critical alert
- HRV < 40 → ⚠️ Low variability
- Abnormal breathing → ⚠️ Check position

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "No data appearing" | Ensure device is connected first |
| "WebSocket error" | Check token is valid, backend running |
| "Polling error" | Verify wearable API token is correct |
| "Slow updates" | Default interval is 5s, increase if needed |
| "Device disconnects" | Reconnect device with fresh token |

## 📞 Need Help?

1. **Check browser console** (F12) for errors
2. **Check server logs** for polling issues
3. **Verify token validity** with wearable provider
4. **Restart streaming** - Stop then Start again
5. **Reconnect device** - Full disconnect and connect cycle

---

**Ready to use?**
1. Start backend and frontend
2. Login to your account
3. Go to "Connected Wearable Devices"
4. Connect a device
5. Click "Start Streaming"
6. Watch live data flow! 📊✨

Enjoy real-time health monitoring! 🎉
