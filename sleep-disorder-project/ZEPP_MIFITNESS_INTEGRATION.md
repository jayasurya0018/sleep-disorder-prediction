# Zepp Life & Mi Fitness Integration Guide

## Overview

Your sleep disorder application now supports **Zepp Life** and **Mi Fitness** wearable devices. This guide explains how to connect these devices and stream real-time health data.

---

## 📱 Supported Devices

### Zepp Life
- **Compatible Devices:** Zepp smartwatches, Amazfit smartwatches
- **Supported Metrics:**
  - Heart Rate Variability (HRV)
  - Blood Oxygen (SpO2)
  - Movement/Activity
  - Breathing Rate
  - Sleep Stages
  - Stress Levels

### Mi Fitness
- **Compatible Devices:** Xiaomi Mi Band, Mi Smart Bands
- **Supported Metrics:**
  - Heart Rate Variability (HRV)
  - Blood Oxygen (SpO2)
  - Movement/Steps
  - Breathing Rate
  - Sleep Stages

---

## 🔐 Getting Access Tokens

### For Zepp Life

1. Go to [Zepp Developer Portal](https://developer.zepp.com)
2. Create a developer account or sign in
3. Create a new application
4. Configure OAuth2 credentials with redirect URI: `http://localhost:5000/callback`
5. Request permissions for: `heart_rate`, `sleep`, `spo2`, `stress`
6. Complete the OAuth2 flow to get your **Access Token**
7. Copy the access token for use in the app

### For Mi Fitness

1. Go to [Xiaomi IoT Developer Platform](https://iot.mi.com/developers)
2. Create a developer account or sign in
3. Create a new project/app
4. Configure OAuth2 scopes: `heart_rate`, `sleep`, `steps`, `spo2`
5. Set redirect URI: `http://localhost:5000/callback`
6. Complete the OAuth2 authentication flow
7. Copy the **Access Token** for use in the app

---

## 🚀 Connecting Devices

### Via Web Dashboard

1. Navigate to **Devices** page in your application
2. Locate the **ZEPP LIFE** or **MI FITNESS** card
3. Paste your access token in the token field
4. Click **Connect** button
5. Wait for connection confirmation (✓ Connected)

### Expected Response

```json
{
  "success": true,
  "message": "Zepp Life connected successfully",
  "device": "zepp"
}
```

### Troubleshooting Connection Issues

**Error: "Failed to connect Zepp Life"**
- Verify the access token is correct
- Check that the token hasn't expired
- Ensure API credentials have proper scopes enabled

**Error: "Failed to connect Mi Fitness"**
- Confirm token validity in Xiaomi developer console
- Verify Xiaomi account has necessary permissions
- Check network connectivity

---

## 📊 Real-Time Data Streaming

Once connected, you can stream live data:

### Start Streaming

1. Click **Start Streaming** button after device connection
2. Real-time data updates appear every 5 seconds (configurable)
3. Live metrics display:
   - **HRV:** Heart Rate Variability (milliseconds)
   - **SpO2:** Blood Oxygen Saturation (percentage)
   - **Movement:** Activity level (0-10)
   - **Breathing:** Breathing rate (breaths per minute)
   - **Sleep Stage:** Current sleep stage (Awake, Light, Deep, REM)
   - **Source:** Device name (zepp, mifitness, fitbit, oura, garmin)

### Stop Streaming

1. Click **Stop Streaming** button to halt data flow
2. WebSocket connection closes gracefully
3. Device remains connected for future streaming sessions

---

## 🔄 Data Synchronization

### Polling Mechanism

The application automatically polls your wearable device at configurable intervals:

```javascript
// Default: 5-second polling interval
{
  "type": "start_wearable",
  "payload": {
    "interval": 5  // seconds
  }
}
```

### Data Transformation

Raw device data is transformed to a standardized format:

```json
{
  "hrv": 65,                        // Heart Rate Variability
  "blood_oxygen": 96,               // SpO2 percentage
  "movement": 5,                    // Activity units (0-10)
  "breathing": 16,                  // Breaths per minute
  "sleepStage": "Light",            // Awake, Light, Deep, REM
  "timestamp": "2025-01-07T10:30:00.000Z",
  "source": "zepp"                  // or "mifitness"
}
```

---

## 🛠️ API Endpoints

### Connect Device

```http
POST /api/wearable/connect/zepp
Content-Type: application/json
Authorization: Bearer <user_token>

{
  "accessToken": "<zepp_access_token>"
}
```

```http
POST /api/wearable/connect/mifitness
Content-Type: application/json
Authorization: Bearer <user_token>

{
  "accessToken": "<mifitness_access_token>"
}
```

### Disconnect Device

```http
DELETE /api/wearable/disconnect
Content-Type: application/json
Authorization: Bearer <user_token>

{
  "device": "zepp"  // or "mifitness"
}
```

### Get Connection Status

```http
GET /api/wearable/status
Authorization: Bearer <user_token>
```

### WebSocket Streaming

Connect to: `ws://localhost:5000/ws?token=<user_token>`

**Start Polling:**
```json
{
  "type": "start_wearable",
  "payload": {
    "interval": 5
  }
}
```

**Stop Polling:**
```json
{
  "type": "stop_wearable"
}
```

**Incoming Data:**
```json
{
  "type": "wearable_data",
  "data": {
    "hrv": 65,
    "blood_oxygen": 96,
    "movement": 5,
    "breathing": 16,
    "sleepStage": "Light",
    "timestamp": "2025-01-07T10:30:00.000Z",
    "source": "zepp"
  }
}
```

---

## 📈 Supported Metrics Comparison

| Metric | Zepp Life | Mi Fitness | Fitbit | Oura | Garmin |
|--------|-----------|-----------|--------|------|--------|
| Heart Rate | ✅ | ✅ | ✅ | ✅ | ✅ |
| HRV | ✅ | ✅ | ✅ | ✅ | ✅ |
| SpO2 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sleep Stages | ✅ | ✅ | ✅ | ✅ | ✅ |
| Movement/Steps | ✅ | ✅ | ✅ | ✅ | ✅ |
| Breathing Rate | ✅ | ✅ | ✅ | ✅ | ✅ |
| Stress | ✅ | ✅ | - | ✅ | ✅ |

---

## 🔐 Security Best Practices

1. **Never share access tokens** - Keep tokens private and secure
2. **Use HTTPS** - Always use HTTPS in production
3. **Token expiration** - Some APIs require periodic token refresh
4. **Scope limitation** - Request only necessary permissions
5. **Data encryption** - WebSocket connections use WSS in production

---

## 📝 Data Export

You can export wearable data in multiple formats:

- **CSV** - Compatible with spreadsheet applications
- **PDF** - Professional report format with charts
- **DOCX** - Microsoft Word format for documents

Export data automatically includes all connected device metrics.

---

## 🐛 Troubleshooting

### Device Disconnects Unexpectedly
- Check network connectivity
- Verify token hasn't expired
- Restart the wearable device
- Reconnect the device

### No Data Being Received
- Ensure wearable device is synced with phone app
- Check that streaming is started
- Verify network permissions
- Check browser console for WebSocket errors

### Token Issues
- Regenerate token in device developer portal
- Ensure token has correct scopes
- Check token expiration date
- Verify correct API endpoint URL

### API Rate Limiting
- Default polling interval: 5 seconds
- Adjust interval if experiencing rate limit errors
- Check API rate limits in device documentation

---

## 📚 Additional Resources

- [Zepp Developer Documentation](https://developer.zepp.com/docs)
- [Xiaomi IoT Platform](https://iot.mi.com/developers)
- [OAuth 2.0 Standards](https://oauth.net/2/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)

---

## 💡 Next Steps

1. ✅ Connect your Zepp Life or Mi Fitness device
2. ✅ Start real-time data streaming
3. ✅ Monitor sleep metrics on the dashboard
4. ✅ Generate reports with wearable data
5. ✅ Set up alerts for anomalies

---

**Last Updated:** January 7, 2026  
**Version:** 1.0  
**Support:** Check project documentation or community forums
