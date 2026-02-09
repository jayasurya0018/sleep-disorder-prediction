# Advanced Features API Documentation

## Overview
This document describes the 4 advanced features integrated into the Sleep Disorder Monitoring System:
1. Wearable Device Integration
2. Data Export (CSV/PDF)
3. Email Alerts & Notifications
4. Real-time Streaming

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## 1. Wearable Device Integration

### Base Path: `/api/wearable`

#### Get Wearable Status
```
GET /api/wearable/status
```

**Response:**
```json
{
  "streaming": "stopped",
  "devices": {
    "fitbit": { "connected": false, "token": "" },
    "oura": { "connected": false, "token": "" },
    "garmin": { "connected": false, "token": "" }
  }
}
```

#### Connect Fitbit Device
```
POST /api/wearable/connect/fitbit
Content-Type: application/json

{
  "accessToken": "your_fitbit_oauth_token"
}
```

**Response:**
```json
{
  "success": true,
  "device": "fitbit",
  "message": "Connected to Fitbit"
}
```

#### Connect Oura Ring
```
POST /api/wearable/connect/oura
Content-Type: application/json

{
  "accessToken": "your_oura_personal_token"
}
```

#### Connect Garmin Watch
```
POST /api/wearable/connect/garmin
Content-Type: application/json

{
  "accessToken": "your_garmin_api_key"
}
```

#### Start Real-time Streaming
```
POST /api/wearable/start-streaming
Content-Type: application/json

{
  "devices": ["fitbit", "oura", "garmin"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Streaming started for: fitbit, oura, garmin",
  "pollingInterval": 30000
}
```

#### Stop Streaming
```
POST /api/wearable/stop-streaming
```

**Response:**
```json
{
  "success": true,
  "message": "Streaming stopped"
}
```

#### Disconnect Device
```
DELETE /api/wearable/disconnect
Content-Type: application/json

{
  "device": "fitbit"
}
```

#### Test Fetch Data
```
GET /api/wearable/test-fetch
```

---

## 2. Data Export

### Base Path: `/api/export`

#### Get Available Data
```
GET /api/export/available
```

**Response:**
```json
{
  "dateRange": {
    "earliest": "2025-11-01T00:00:00.000Z",
    "latest": "2025-12-05T23:59:59.999Z"
  },
  "recordCount": 156,
  "dataTypes": ["sleep", "heart_rate", "steps", "alerts"]
}
```

#### Export to CSV
```
POST /api/export/csv
Content-Type: application/json

{
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2025-12-05T23:59:59.999Z"
}
```

**Response:** Binary CSV file download

**CSV Format:**
```
Date,Sleep Quality,Duration (hrs),Heart Rate Avg,REM %,Deep Sleep %,Light Sleep %,Alerts
2025-12-05,85,7.5,65,20,25,55,1
2025-12-04,92,8.2,62,22,28,50,0
...
```

#### Export to PDF
```
POST /api/export/pdf
Content-Type: application/json

{
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2025-12-05T23:59:59.999Z"
}
```

**Response:** Binary PDF file download

**PDF Includes:**
- Sleep statistics (average duration, quality score)
- Charts and graphs
- Heart rate trends
- Alert logs
- Weekly breakdown
- Recommendations based on data

---

## 3. Email Alerts & Notifications

### Base Path: `/api/email`

#### Send Test Email
```
POST /api/email/test
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

#### Save Email Preferences
```
POST /api/email/preferences
Content-Type: application/json

{
  "emailAddress": "user@example.com",
  "alertsEnabled": true,
  "dailySummary": true,
  "dailySummaryTime": "08:00",
  "severityThreshold": "moderate"
}
```

**Severity Thresholds:**
- `critical`: Only critical alerts
- `high`: High and critical alerts
- `moderate`: Moderate, high, and critical alerts
- `all`: All alerts

**Response:**
```json
{
  "success": true,
  "message": "Preferences saved"
}
```

#### Get Email Preferences
```
GET /api/email/preferences
```

**Response:**
```json
{
  "emailAddress": "user@example.com",
  "alertsEnabled": true,
  "dailySummary": true,
  "dailySummaryTime": "08:00",
  "severityThreshold": "moderate"
}
```

#### Alert Email Example

**Subject:** 🚨 Sleep Quality Alert - High Heart Rate Detected

**Body (HTML):**
```
Dear User,

A potential sleep issue has been detected:

Issue: Elevated Heart Rate During Sleep
Severity: HIGH
Time: 2025-12-05 03:45 AM
Heart Rate: 98 bpm (Normal: 60-80)
Duration: 15 minutes

Recommended Actions:
1. Check for environmental factors (temperature, noise)
2. Avoid caffeine before bedtime
3. Consider relaxation techniques

Current Sleep Data:
- Sleep Quality: 72%
- Duration: 6.5 hours
- REM Sleep: 18%
- Deep Sleep: 20%

View Full Report: [Dashboard Link]

Best regards,
Sleep Disorder Monitoring System
```

---

## 4. Real-time Streaming

### WebSocket Connection
```
ws://localhost:5000/ws
```

### Connection Flow
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  // Subscribe to channels
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'sleep-data'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time data:', data);
};
```

### Message Types

#### Subscribe to Sleep Data
```json
{
  "type": "subscribe",
  "channel": "sleep-data"
}
```

#### Real-time Data Update
```json
{
  "type": "data-update",
  "channel": "sleep-data",
  "timestamp": "2025-12-05T03:45:00.000Z",
  "data": {
    "heartRate": 65,
    "sleepStage": "light",
    "sleepQuality": 85,
    "movementDetected": false,
    "alerts": []
  }
}
```

#### Alert Notification
```json
{
  "type": "alert",
  "channel": "alerts",
  "severity": "high",
  "message": "High heart rate detected",
  "timestamp": "2025-12-05T03:45:00.000Z",
  "data": {
    "heartRate": 98,
    "expectedRange": "60-80",
    "duration": "15 minutes"
  }
}
```

#### Streaming Status Change
```json
{
  "type": "status",
  "channel": "streaming",
  "status": "running",
  "devices": ["fitbit", "oura"],
  "timestamp": "2025-12-05T03:00:00.000Z"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": true,
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Error Codes
- `UNAUTHORIZED`: Invalid or missing token
- `INVALID_DEVICE`: Device not recognized
- `CONNECTION_FAILED`: Cannot connect to device
- `INVALID_DATE_RANGE`: Start date after end date
- `EMAIL_INVALID`: Invalid email format
- `EXPORT_FAILED`: Export generation failed
- `STREAMING_ERROR`: Real-time streaming error

---

## Integration Examples

### Frontend React Component Example
```javascript
// Connect a wearable device
async function connectFitbit(accessToken) {
  const response = await fetch('/api/wearable/connect/fitbit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ accessToken })
  });
  
  const result = await response.json();
  return result;
}

// Export data as CSV
async function exportData() {
  const response = await fetch('/api/export/csv', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      startDate: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
      endDate: new Date().toISOString()
    })
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sleep-data.csv';
  a.click();
}

// Subscribe to real-time updates
function subscribeToLiveData() {
  const ws = new WebSocket('ws://localhost:5000/ws');
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    updateDashboard(message.data);
  };
}
```

---

## Configuration

### Environment Variables
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Wearable Device Keys
FITBIT_CLIENT_ID=your_fitbit_id
FITBIT_CLIENT_SECRET=your_fitbit_secret

OURA_API_KEY=your_oura_key

GARMIN_CLIENT_ID=your_garmin_id
GARMIN_CLIENT_SECRET=your_garmin_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sleep_disorder

# Server
PORT=5000
NODE_ENV=development
```

---

## Performance & Limits

| Feature | Limit | Notes |
|---------|-------|-------|
| Data Export | 1 year per request | Larger ranges may timeout |
| Email Rate | 10 per hour | Prevents spam |
| WebSocket Connections | 100 concurrent | Per server instance |
| CSV File Size | 50MB max | Compression available |
| PDF File Size | 25MB max | Auto-optimized |

---

## Testing

Run the feature test suite:
```bash
cd server
node test-features.js
```

---

## Support & Troubleshooting

### Wearable Device Connection Issues
- Verify access token validity
- Check network connectivity
- Ensure device is active and synced
- Review rate limits with device API

### Email Not Sending
- Verify SMTP credentials
- Check firewall/email provider settings
- Enable "Less secure app access" for Gmail
- Verify recipient email is valid

### Export Generation Failing
- Check available disk space
- Verify date range validity
- Ensure database is accessible
- Try smaller date ranges

### Real-time Streaming Lag
- Check network latency
- Reduce polling interval
- Close other WebSocket connections
- Monitor server CPU/memory usage
