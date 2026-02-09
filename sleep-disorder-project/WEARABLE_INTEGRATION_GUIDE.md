# Real-Time Wearable Data Integration Guide

## Overview

The system now fully integrates real-time wearable device data streaming using WebSocket connections. The integration supports Fitbit, Oura Ring, and Garmin devices with automatic data polling and real-time analysis.

## Architecture

### Backend Components

#### 1. **Wearable Service** (`server/services/wearableService.js`)
- Manages device connections (Fitbit, Oura Ring, Garmin)
- Handles OAuth2 authentication with wearable APIs
- Fetches real-time data from connected devices
- Transforms device-specific data to standardized format
- Provides continuous polling capability

**Key Methods:**
- `connectFitbit(userId, accessToken)` - Connect Fitbit device
- `connectOura(userId, accessToken)` - Connect Oura Ring
- `connectGarmin(userId, accessToken)` - Connect Garmin device
- `fetchFitbitData(userId)` - Get real-time Fitbit data
- `fetchOuraData(userId)` - Get real-time Oura data
- `fetchGarminData(userId)` - Get real-time Garmin data
- `getConnectionStatus(userId)` - Check device status

#### 2. **WebSocket Server** (`server/websocket.js`)
- Manages real-time bi-directional communication
- Authenticates users via JWT tokens
- Handles incoming commands from clients
- Broadcasts data to all connected clients
- **NEW:** Automatic wearable data polling on server-side

**New Functions:**
- `startWearablePolling(userId, ws, interval)` - Start automatic device polling
- `stopWearablePolling(userId)` - Stop polling and cleanup
- Support for `start_wearable` and `stop_wearable` message types

#### 3. **Streaming Service** (`server/services/streamingService.js`)
- Real-time data analysis using ML models
- Anomaly detection algorithms
- Data buffering in circular buffers
- Rule-based fallback analysis

### Frontend Components

#### WearableDevices Component (`client/src/components/WearableDevices.js`)

**Enhanced Features:**
- Device management UI with connect/disconnect buttons
- Real-time data streaming controls
- Live data dashboard with 6 key metrics
- WebSocket integration with automatic reconnection
- Data history tracking (last 50 readings)
- Anomaly alerts

**Live Data Metrics Displayed:**
- Heart Rate Variability (HRV) - milliseconds
- Blood Oxygen Level (SpO2) - percentage
- Movement - acceleration units
- Breathing Rate - breaths per minute
- Sleep Stage - current sleep stage
- Data Source - which device is providing data

**New State Variables:**
- `liveData` - Current real-time data point
- `dataHistory` - Last 50 readings from device
- `wsRef` - WebSocket connection reference

## Data Flow

```
Device API → Wearable Service → WebSocket Server → Client Browser
     ↓              ↓                  ↓              ↓
   Poll        Transform        Broadcast to       Display
  Real-time     to Standard      Connected Users    Live Data
   Data         Format           via WebSocket
```

## Message Protocol

### Client to Server Messages

#### Start Wearable Polling
```json
{
  "type": "start_wearable",
  "payload": {
    "interval": 5
  }
}
```

#### Stop Wearable Polling
```json
{
  "type": "stop_wearable"
}
```

### Server to Client Messages

#### Wearable Data Update
```json
{
  "type": "wearable_data",
  "data": {
    "hrv": 55,
    "blood_oxygen": 96,
    "movement": 2.5,
    "breathing": 15,
    "sleepStage": "Deep",
    "timestamp": "2025-12-06T10:30:45.123Z",
    "source": "fitbit"
  },
  "analysis": {
    "prediction": {...},
    "confidence": 0.85,
    "latency": "150ms"
  },
  "anomalies": [],
  "timestamp": "2025-12-06T10:30:45.200Z"
}
```

#### Polling Started Confirmation
```json
{
  "type": "polling_started",
  "device": "fitbit",
  "interval": 5,
  "message": "Polling fitbit data every 5s"
}
```

#### Anomaly Alert
```json
{
  "type": "anomaly",
  "severity": "Moderate",
  "message": "Low blood oxygen detected",
  "data": {...},
  "timestamp": "2025-12-06T10:30:45.123Z"
}
```

## Setup Instructions

### 1. Backend Setup

```bash
cd server
npm install
npm start
```

Server runs on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd client
npm install
npm start
```

Frontend runs on `http://localhost:3000`

### 3. Connect Wearable Device

1. Navigate to "Connected Wearable Devices" page
2. Enter your device's access token:
   - **Fitbit**: Get from `https://dev.fitbit.com`
   - **Oura**: Get from `https://cloud.ouraring.com`
   - **Garmin**: Get from `https://developer.garmin.com`
3. Click "Connect" button
4. Once connected, click "Start Streaming"

### 4. View Live Data

Once streaming is active:
- Real-time metrics update every 5 seconds
- Live dashboard shows current vital signs
- Data history displays last 50 readings
- Anomalies trigger instant alerts

## Data Transformation

### Fitbit → Standard Format
```javascript
{
  hrv: calculated from HR variability,
  blood_oxygen: from SpO2 endpoint,
  movement: calculated from steps,
  breathing: estimated from HR,
  sleepStage: mapped from Fitbit stages
}
```

### Oura → Standard Format
```javascript
{
  hrv: from HRV balance metric,
  blood_oxygen: from average breath,
  movement: calculated from efficiency,
  breathing: from average breath,
  sleepStage: mapped from Oura sleep type
}
```

### Garmin → Standard Format
```javascript
{
  hrv: from wellness data,
  blood_oxygen: estimated value,
  movement: from activity data,
  breathing: estimated from HR,
  sleepStage: from sleep tracking
}
```

## Real-Time Analysis

Each data point triggers:

1. **ML Analysis** - ML model prediction (if available)
2. **Anomaly Detection** - Check for abnormal patterns
3. **Rule-Based Analysis** - Fallback analysis using clinical rules
4. **Alert Generation** - Send alerts if issues detected

### Anomaly Detection Thresholds

- **SpO2 < 90%**: Critical desaturation
- **SpO2 < 94%**: Low oxygen
- **HRV < 20**: Very low variability
- **HRV < 40**: Low variability
- **Breathing rate outside 8-20**: Abnormal rate
- **Movement > 10**: Excessive movement

## Troubleshooting

### WebSocket Connection Fails
- Check JWT token is valid
- Verify backend is running on port 5000
- Check browser console for specific errors

### No Data Appearing
- Ensure device is properly connected
- Verify access token is valid
- Check wearable API rate limits
- Review server logs for polling errors

### Slow Data Updates
- Check network connection speed
- Adjust polling interval (default: 5s)
- Monitor server CPU usage
- Check for ML service delays

### Device Disconnects
- Verify access token hasn't expired
- Check wearable API authentication
- Restart streaming by clicking "Stop" then "Start"
- Reconnect device with fresh token

## Performance Considerations

- **Polling Interval**: Default 5 seconds (configurable)
- **Data History**: Keeps last 50 readings in memory
- **Circular Buffer**: Stores up to 100 data points per user
- **ML Timeout**: 1 second (falls back to rule-based if exceeded)
- **WebSocket Heartbeat**: 30 seconds keep-alive ping

## Future Enhancements

- [ ] Apple Watch HealthKit integration
- [ ] Real-time data persistence to database
- [ ] Historical data analytics
- [ ] Comparative device analysis
- [ ] Custom alert threshold configuration
- [ ] Data export to health platforms
- [ ] Advanced ML model deployment
- [ ] Multi-device simultaneous tracking

## References

- [Fitbit API Documentation](https://dev.fitbit.com/docs/)
- [Oura API Documentation](https://cloud.ouraring.com/docs/)
- [Garmin API Documentation](https://developer.garmin.com/health-api/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [JWT Authentication](https://jwt.io/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for errors
3. Check browser console (F12) for client-side errors
4. Verify network connectivity to wearable APIs
5. Contact support with error details
