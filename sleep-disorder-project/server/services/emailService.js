/**
 * Email Alert Service
 * Send email notifications for critical sleep events
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
        this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.initialize();
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        return this.emailRegex.test(email);
    }

    /**
     * Initialize email transporter
     */
    initialize() {
        try {
            // Configure with Gmail SMTP with TLS settings
            this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER || 'your-email@gmail.com',
                    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
                },
                tls: {
                    rejectUnauthorized: false // Allow self-signed certificates
                },
                logger: false,
                debug: false
            });

            this.initialized = true;
            console.log('✅ Email service initialized with Gmail SMTP');

        } catch (error) {
            console.error('Email service initialization error:', error);
            this.initialized = false;
        }
    }

    /**
     * Send alert email
     */
    async sendAlert(userEmail, alertData) {
        if (!this.initialized) {
            console.warn('Email service not initialized - skipping email');
            return { success: false, reason: 'not_initialized' };
        }

        // Validate email format
        if (!this.isValidEmail(userEmail)) {
            console.error('Invalid email format:', userEmail);
            return { success: false, error: 'Invalid email format' };
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'Sleep Monitor <noreply@sleepmonitor.com>',
                to: userEmail,
                subject: this.getSubject(alertData),
                html: this.generateEmailHTML(alertData),
                text: this.generateEmailText(alertData)
            };

            const info = await this.transporter.sendMail(mailOptions);

            console.log('Alert email sent to:', userEmail, 'MessageID:', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('Email send error for', userEmail, ':', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate email subject based on severity
     */
    getSubject(alertData) {
        const severity = alertData.severity || 'medium';
        const prefixes = {
            critical: '🚨 CRITICAL ALERT',
            high: '⚠️ HIGH PRIORITY ALERT',
            medium: '⚡ Sleep Monitor Alert',
            low: '📊 Sleep Monitor Notification'
        };

        return `${prefixes[severity]} - ${alertData.title || 'Sleep Anomaly Detected'}`;
    }

    /**
     * Generate HTML email content
     */
    generateEmailHTML(alertData) {
        const timestamp = new Date(alertData.timestamp).toLocaleString();

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .alert-box { background: ${this.getAlertColor(alertData.severity)}; 
                     padding: 15px; border-radius: 5px; margin: 15px 0; color: white; }
        .metrics { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .metric-row { display: flex; justify-content: space-between; padding: 8px 0; 
                      border-bottom: 1px solid #eee; }
        .footer { background: #333; color: white; padding: 15px; 
                  border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; }
        .button { background: #667eea; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌙 Sleep Disorder Monitor</h1>
            <p>Real-time Health Alert</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h2>${alertData.title || 'Sleep Anomaly Detected'}</h2>
                <p><strong>Time:</strong> ${timestamp}</p>
                <p><strong>Severity:</strong> ${(alertData.severity || 'medium').toUpperCase()}</p>
            </div>

            <h3>Alert Details</h3>
            <p>${alertData.message || 'An anomaly has been detected in your sleep monitoring data.'}</p>

            ${alertData.metrics ? `
            <div class="metrics">
                <h3>Current Metrics</h3>
                ${alertData.metrics.hrv ? `
                <div class="metric-row">
                    <span><strong>Heart Rate Variability:</strong></span>
                    <span>${alertData.metrics.hrv.toFixed(1)} ms</span>
                </div>` : ''}
                ${alertData.metrics.blood_oxygen ? `
                <div class="metric-row">
                    <span><strong>Blood Oxygen:</strong></span>
                    <span>${alertData.metrics.blood_oxygen.toFixed(1)}%</span>
                </div>` : ''}
                ${alertData.metrics.breathing ? `
                <div class="metric-row">
                    <span><strong>Breathing Rate:</strong></span>
                    <span>${alertData.metrics.breathing.toFixed(1)} breaths/min</span>
                </div>` : ''}
                ${alertData.metrics.sleepStage ? `
                <div class="metric-row">
                    <span><strong>Sleep Stage:</strong></span>
                    <span>${alertData.metrics.sleepStage}</span>
                </div>` : ''}
            </div>` : ''}

            ${alertData.prediction ? `
            <div class="metrics">
                <h3>AI Analysis</h3>
                <div class="metric-row">
                    <span><strong>Detected Disorder:</strong></span>
                    <span>${alertData.prediction.disorder}</span>
                </div>
                <div class="metric-row">
                    <span><strong>Severity:</strong></span>
                    <span>${alertData.prediction.severity}</span>
                </div>
                <div class="metric-row">
                    <span><strong>Confidence:</strong></span>
                    <span>${(alertData.prediction.confidence * 100).toFixed(1)}%</span>
                </div>
            </div>` : ''}

            <h3>Recommended Actions</h3>
            <ul>
                ${this.getRecommendations(alertData).map(rec => `<li>${rec}</li>`).join('')}
            </ul>

            <a href="${process.env.DASHBOARD_URL || 'http://localhost:3000/live-monitoring'}" class="button">
                View Live Dashboard
            </a>
        </div>

        <div class="footer">
            <p>Sleep Disorder Monitoring System</p>
            <p>This is an automated alert. For medical emergencies, contact emergency services.</p>
            <p style="margin-top: 10px; font-size: 10px;">
                To stop receiving these alerts, update your notification preferences in settings.
            </p>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Generate plain text email content
     */
    generateEmailText(alertData) {
        const timestamp = new Date(alertData.timestamp).toLocaleString();
        
        let text = `SLEEP DISORDER MONITOR - ALERT\n\n`;
        text += `${alertData.title || 'Sleep Anomaly Detected'}\n`;
        text += `Time: ${timestamp}\n`;
        text += `Severity: ${(alertData.severity || 'medium').toUpperCase()}\n\n`;
        text += `${alertData.message || 'An anomaly has been detected.'}\n\n`;

        if (alertData.metrics) {
            text += `CURRENT METRICS:\n`;
            if (alertData.metrics.hrv) text += `- Heart Rate Variability: ${alertData.metrics.hrv.toFixed(1)} ms\n`;
            if (alertData.metrics.blood_oxygen) text += `- Blood Oxygen: ${alertData.metrics.blood_oxygen.toFixed(1)}%\n`;
            if (alertData.metrics.breathing) text += `- Breathing Rate: ${alertData.metrics.breathing.toFixed(1)} breaths/min\n`;
            if (alertData.metrics.sleepStage) text += `- Sleep Stage: ${alertData.metrics.sleepStage}\n`;
            text += `\n`;
        }

        if (alertData.prediction) {
            text += `AI ANALYSIS:\n`;
            text += `- Detected Disorder: ${alertData.prediction.disorder}\n`;
            text += `- Severity: ${alertData.prediction.severity}\n`;
            text += `- Confidence: ${(alertData.prediction.confidence * 100).toFixed(1)}%\n\n`;
        }

        text += `RECOMMENDED ACTIONS:\n`;
        this.getRecommendations(alertData).forEach(rec => {
            text += `- ${rec}\n`;
        });

        text += `\nView live dashboard: http://localhost:3000/live-monitoring\n`;

        return text;
    }

    /**
     * Get alert background color based on severity
     */
    getAlertColor(severity) {
        const colors = {
            critical: '#dc2626',
            high: '#f59e0b',
            medium: '#3b82f6',
            low: '#10b981'
        };
        return colors[severity] || colors.medium;
    }

    /**
     * Get recommendations based on alert data
     */
    getRecommendations(alertData) {
        const recommendations = [];
        const severity = alertData.severity || 'medium';

        if (severity === 'critical') {
            recommendations.push('Seek immediate medical attention');
            recommendations.push('Contact your healthcare provider');
        }

        if (alertData.prediction?.disorder === 'Sleep Apnea') {
            recommendations.push('Check your sleeping position');
            recommendations.push('Ensure airways are clear');
            recommendations.push('Consider using CPAP device if prescribed');
        }

        if (alertData.metrics?.blood_oxygen < 90) {
            recommendations.push('Improve room ventilation');
            recommendations.push('Practice deep breathing exercises');
        }

        if (alertData.metrics?.breathing > 25) {
            recommendations.push('Try relaxation techniques');
            recommendations.push('Reduce room temperature');
        }

        // Default recommendations
        recommendations.push('Monitor your condition on the dashboard');
        recommendations.push('Keep a record of sleep patterns');
        recommendations.push('Maintain regular sleep schedule');

        return recommendations;
    }

    /**
     * Send daily summary email
     */
    async sendDailySummary(userEmail, summaryData) {
        if (!this.initialized) {
            return { success: false, reason: 'not_initialized' };
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'Sleep Monitor <noreply@sleepmonitor.com>',
                to: userEmail,
                subject: '📊 Daily Sleep Summary Report',
                html: this.generateSummaryHTML(summaryData),
                text: this.generateSummaryText(summaryData)
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Summary email sent:', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('Summary email error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate summary email HTML
     */
    generateSummaryHTML(summaryData) {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .stats { background: white; padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .stat-card { background: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Daily Sleep Summary</h1>
            <p>${new Date().toLocaleDateString()}</p>
        </div>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${summaryData.totalRecords || 0}</div>
                <div class="stat-label">Total Records</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summaryData.avgHRV?.toFixed(0) || 'N/A'}</div>
                <div class="stat-label">Avg HRV (ms)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summaryData.avgSpO2?.toFixed(1) || 'N/A'}%</div>
                <div class="stat-label">Avg Blood Oxygen</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summaryData.alertCount || 0}</div>
                <div class="stat-label">Alerts</div>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Generate summary email text
     */
    generateSummaryText(summaryData) {
        return `
DAILY SLEEP SUMMARY - ${new Date().toLocaleDateString()}

Total Records: ${summaryData.totalRecords || 0}
Average HRV: ${summaryData.avgHRV?.toFixed(0) || 'N/A'} ms
Average Blood Oxygen: ${summaryData.avgSpO2?.toFixed(1) || 'N/A'}%
Alerts: ${summaryData.alertCount || 0}
        `;
    }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService;
