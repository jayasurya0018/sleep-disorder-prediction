# Zepp Life & Mi Fitness Quick Start

## 30-Second Setup

### 1. Get Access Token
- **Zepp Life:** [developer.zepp.com](https://developer.zepp.com) → OAuth2 → Copy token
- **Mi Fitness:** [iot.mi.com](https://iot.mi.com) → App settings → Copy token

### 2. Connect Device
1. Open app → Go to **Devices** page
2. Find **ZEPP LIFE** or **MI FITNESS** card
3. Paste access token
4. Click **Connect** ✓

### 3. Start Streaming
1. Click **Start Streaming** button
2. Watch real-time metrics update every 5 seconds
3. Click **Stop Streaming** to pause

---

## Supported Metrics

Both devices provide:
- **HRV** (Heart Rate Variability)
- **SpO2** (Blood Oxygen)
- **Movement** (Activity Level)
- **Breathing Rate**
- **Sleep Stages**

---

## API Endpoints

```bash
# Connect Zepp
POST /api/wearable/connect/zepp
{ "accessToken": "your_token" }

# Connect Mi Fitness
POST /api/wearable/connect/mifitness
{ "accessToken": "your_token" }

# Get Status
GET /api/wearable/status

# Disconnect
DELETE /api/wearable/disconnect
{ "device": "zepp" }
```

---

## WebSocket Messages

```javascript
// Start real-time data stream
ws.send(JSON.stringify({
  type: 'start_wearable',
  payload: { interval: 5 }
}));

// Stop real-time data stream
ws.send(JSON.stringify({
  type: 'stop_wearable'
}));
```

---

## Data Format

```json
{
  "hrv": 65,
  "blood_oxygen": 96,
  "movement": 5,
  "breathing": 16,
  "sleepStage": "Light",
  "timestamp": "2025-01-07T10:30:00Z",
  "source": "zepp"
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token invalid | Regenerate in device developer portal |
| No data | Ensure wearable is synced with phone app |
| Connection fails | Check network, verify token scopes |
| Keeps disconnecting | Check token expiration, restart device |

---

**Need more help?** See [ZEPP_MIFITNESS_INTEGRATION.md](ZEPP_MIFITNESS_INTEGRATION.md)
