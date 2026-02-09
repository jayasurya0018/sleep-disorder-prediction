# Email Service - Integration Guide

**Purpose:** Connect email alerts to actual sleep anomaly detection  
**Status:** Email service ready, waiting for anomaly detector to call it  
**Files to Implement:** (Currently missing)  

---

## Current State

### What Works ✅
- Email service sends HTML/plain text emails
- Rate limiting prevents abuse
- Validation prevents invalid emails
- Configuration from environment variables
- Test endpoint for validation

### What's Missing ⚠️
- **No automatic triggers** - Nothing calls emailService.sendAlert()
- **No anomaly detection** - Need to detect when to send alerts
- **No daily summaries** - Cron job not set up
- **No integration points** - ML/stream services don't emit email events

---

## Integration Points

### 1. When Anomaly Detected (Alert)

**Current Flow:**
```
Wearable Data → Stream Service → Database
                                    ↓
                            [HERE - Add Email] ← MISSING
```

**Needed Location:** `server/routes/dataRoutes.js` or anomaly detection service

**Example Implementation:**
```javascript
// server/routes/dataRoutes.js or services/alertService.js

const emailService = require('../services/emailService');

// When anomaly is detected:
if (anomalyDetected) {
    // Store alert in database
    const alert = await Alert.create({
        userId,
        severity: 'high',
        type: 'sleep_apnea',
        metrics: sleepData,
        prediction: mlPrediction
    });

    // Send email to user
    const user = await User.findById(userId);
    if (user.preferences?.emailAlerts) {
        await emailService.sendAlert(user.email, {
            title: 'Sleep Apnea Detected',
            message: 'Significant breathing interruptions detected in your sleep.',
            severity: 'high',
            timestamp: new Date(),
            metrics: {
                hrv: sleepData.hrv,
                blood_oxygen: sleepData.blood_oxygen,
                breathing: sleepData.breathing,
                sleepStage: sleepData.sleepStage
            },
            prediction: {
                disorder: mlPrediction.disorder,
                severity: mlPrediction.severity,
                confidence: mlPrediction.confidence
            }
        });
    }
}
```

---

### 2. Daily Summary (Scheduled Job)

**Current Flow:**
```
Every Day at 8 AM
    ↓
Calculate daily stats
    ↓
[HERE - Send Email] ← MISSING
```

**Files to Create:**
- `server/jobs/dailySummaryJob.js` (New)
- Update `server/index.js` to schedule the job

**Implementation:**

**Step 1: Create job file**
```javascript
// server/jobs/dailySummaryJob.js

const cron = require('node-cron');
const User = require('../models/User');
const SleepData = require('../models/SleepData');
const emailService = require('../services/emailService');

/**
 * Send daily summary emails
 * Runs at 8 AM every day
 */
const startDailySummaryJob = () => {
    // Schedule: 0 8 * * * = 8:00 AM every day
    cron.schedule('0 8 * * *', async () => {
        console.log('🔔 Starting daily summary email job...');
        
        try {
            // Find all users with daily summary enabled
            const users = await User.find({
                'preferences.dailySummary': true
            });

            console.log(`Found ${users.length} users with daily summaries enabled`);

            for (const user of users) {
                try {
                    // Calculate yesterday's stats
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    yesterday.setHours(0, 0, 0, 0);

                    const tomorrow = new Date(yesterday);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const records = await SleepData.find({
                        userId: user._id,
                        timestamp: {
                            $gte: yesterday,
                            $lt: tomorrow
                        }
                    });

                    if (records.length === 0) {
                        continue; // Skip if no data
                    }

                    // Calculate averages
                    const avgHRV = records.reduce((sum, r) => sum + (r.hrv || 0), 0) / records.length;
                    const avgSpO2 = records.reduce((sum, r) => sum + (r.blood_oxygen || 0), 0) / records.length;
                    const alertCount = records.filter(r => r.alert).length;

                    // Send summary email
                    const summaryData = {
                        date: yesterday.toLocaleDateString(),
                        totalRecords: records.length,
                        avgHRV: avgHRV.toFixed(1),
                        avgSpO2: avgSpO2.toFixed(1),
                        alertCount
                    };

                    await emailService.sendDailySummary(user.email, summaryData);
                    console.log(`✅ Summary sent to ${user.email}`);

                } catch (error) {
                    console.error(`❌ Error sending summary to ${user.email}:`, error.message);
                }
            }

            console.log('✅ Daily summary job complete');

        } catch (error) {
            console.error('❌ Daily summary job error:', error);
        }
    });
};

module.exports = { startDailySummaryJob };
```

**Step 2: Install node-cron**
```bash
npm install node-cron
```

**Step 3: Register in server/index.js**
```javascript
const { startDailySummaryJob } = require('./jobs/dailySummaryJob');

// After server starts listening:
server.listen(PORT, async () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Dashboard: ${process.env.CLIENT_URL}`);
    
    // Start background jobs
    startDailySummaryJob(); // NEW
});
```

---

### 3. Real-Time Streaming Alerts

**Current Flow:**
```
WebSocket Connection ← Wearable Data
    ↓
Display on Dashboard
    ↓
[HERE - Add Email for Critical] ← MISSING
```

**Implementation in `server/routes/streamRoutes.js`:**
```javascript
// Add email alert for critical metrics
io.on('connection', (socket) => {
    socket.on('wearable_data', async (data) => {
        // Check for critical conditions
        if (data.blood_oxygen < 85) {
            const user = await User.findById(data.userId);
            if (user?.preferences?.emailAlerts) {
                await emailService.sendAlert(user.email, {
                    title: '⚠️ Low Blood Oxygen Alert',
                    severity: 'critical',
                    message: `Your blood oxygen level is critically low: ${data.blood_oxygen}%`,
                    timestamp: new Date(),
                    metrics: { blood_oxygen: data.blood_oxygen }
                });
            }
        }
    });
});
```

---

## Email Alert Severity Levels

### Critical (Immediate Medical Attention)
```
- Blood oxygen < 85%
- Heart rate > 150 BPM (resting)
- Severe breathing interruptions
- Loss of consciousness events
```

**Email:**
```
Subject: 🚨 CRITICAL ALERT - Seek Medical Attention
Recommendations: ["Seek immediate medical attention", "Contact emergency services"]
```

### High (Doctor Appointment Needed)
```
- Blood oxygen 85-90%
- Sleep apnea detected
- Significant arrhythmia
- Repeated anomalies same night
```

**Email:**
```
Subject: ⚠️ HIGH PRIORITY ALERT
Recommendations: ["Contact your healthcare provider", "Schedule a checkup"]
```

### Medium (Monitor Condition)
```
- Unusual sleep stage patterns
- Elevated resting heart rate
- Minor breathing irregularities
```

**Email:**
```
Subject: ⚡ Sleep Monitor Alert
Recommendations: ["Monitor your condition", "Keep a sleep diary"]
```

### Low (Information Only)
```
- Sleep efficiency changes
- New sleep patterns
- Informational updates
```

**Email:**
```
Subject: 📊 Sleep Monitor Notification
Recommendations: ["Review on dashboard", "Compare with previous nights"]
```

---

## User Preferences Schema

Currently in `User.preferences`:
```javascript
{
    emailAlerts: true,                          // Enable/disable emails
    alertSeverity: ['critical', 'high'],        // Which severities to send
    dailySummary: false,                        // Send daily summaries
    dailySummaryTime: '08:00',                  // What time (optional)
    unsubscribeToken: 'unique-hash'             // For unsubscribe links
}
```

**Update Needed:**
```javascript
{
    emailAlerts: true,
    alertSeverity: ['critical', 'high', 'medium'],
    dailySummary: true,  // ← Add this option
    dailySummaryTime: '08:00',
    alertThreshholds: {   // ← Add this for custom sensitivity
        spO2_low: 90,
        hrv_low: 30,
        breathing_high: 25
    },
    emailFrequency: 'immediate'  // immediate | digest | daily
}
```

---

## Testing Email Integration

### 1. Test Alert Email Manually
```bash
# Trigger a test alert
POST /api/data/alert
{
    "title": "Test Sleep Apnea Detection",
    "severity": "high",
    "message": "This is a test alert",
    "metrics": {
        "hrv": 45,
        "blood_oxygen": 88,
        "breathing": 28,
        "sleepStage": "Deep"
    }
}
```

### 2. Check Email Delivery
```bash
# Query alerts sent to user
GET /api/email/alerts?days=7

# Response:
{
    "sent": 5,
    "failed": 0,
    "alerts": [
        {
            "timestamp": "2026-02-09T14:30:00Z",
            "recipient": "user@example.com",
            "subject": "🚨 CRITICAL ALERT",
            "status": "sent",
            "messageId": "..."
        }
    ]
}
```

### 3. Monitor Email Service Health
```bash
GET /api/health/email

# Response:
{
    "emailService": {
        "initialized": true,
        "provider": "gmail",
        "testsPassed": 1,
        "testsFailed": 0,
        "lastEmailSent": "2026-02-09T14:30:00Z"
    }
}
```

---

## Implementation Priority

### Phase 1 (This Week) - Critical Paths
1. ✅ Email service ready
2. ⬜ Add alert email trigger when anomaly detected
3. ⬜ Set up daily summary cron job
4. ⬜ Test end-to-end alert flow

### Phase 2 (Next Week) - Refinement
5. ⬜ Add unsubscribe links
6. ⬜ Create email preference UI
7. ⬜ Track email delivery status
8. ⬜ Add email analytics

### Phase 3 (Later) - Advanced
9. ⬜ Multi-language emails
10. ⬜ Personalized recommendations
11. ⬜ Email template customization
12. ⬜ SMS alerts (Twilio)

---

## Database Changes Needed

### New Collection: Alerts
```javascript
{
    _id: ObjectId,
    userId: ObjectId,
    type: 'sleep_apnea|irregular_heartbeat|low_oxygen',
    severity: 'critical|high|medium|low',
    timestamp: Date,
    metrics: { hrv, blood_oxygen, breathing, sleepStage },
    prediction: { disorder, severity, confidence },
    emailSent: Boolean,
    emailSentAt: Date,
    emailStatus: 'sent|failed|bounced',
    emailMessageId: String
}
```

### Update User Model
```javascript
// Add to User schema:
{
    preferences: {
        emailAlerts: Boolean,
        alertSeverity: [String],
        dailySummary: Boolean,
        dailySummaryTime: String,
        alertThresholds: {
            spO2_low: Number,
            hrv_low: Number,
            breathing_high: Number
        }
    },
    emailStats: {
        totalSent: Number,
        lastAlertEmail: Date,
        lastSummaryEmail: Date
    }
}
```

---

## Environment Variables Needed

```bash
# Already set
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-password
DASHBOARD_URL=https://yourdomain.com

# New for scheduler
DAILY_SUMMARY_ENABLED=true
DAILY_SUMMARY_TIME=08:00
TIMEZONE=America/New_York

# Alert thresholds
ALERT_SPO2_CRITICAL=85
ALERT_SPO2_HIGH=90
ALERT_HRV_LOW=30
ALERT_BREATHING_HIGH=25
```

---

## Estimated Effort

| Task | Hours | Priority |
|------|-------|----------|
| Add alert trigger | 2 | P0 |
| Daily summary job | 1.5 | P1 |
| Email preference UI | 2 | P1 |
| Testing & QA | 2 | P1 |
| **Total** | **7.5** | - |

---

## Success Criteria

✅ Alerts send when anomaly detected  
✅ Daily summary emails send at 8 AM  
✅ Users can toggle email alerts on/off  
✅ Users receive correct severity levels  
✅ Less than 5% email delivery failure rate  
✅ Emails arrive within 30 seconds of trigger  

---

## Resources

- **nodemailer docs**: https://nodemailer.com/
- **node-cron docs**: https://github.com/kelektiv/node-cron
- **Email best practices**: https://developers.google.com/gmail/markup/overview
- **GDPR email compliance**: https://gdpr-info.eu/

---

**Next Action:** Identify where anomalies are detected in your data pipeline, and add email alerts at those points.
