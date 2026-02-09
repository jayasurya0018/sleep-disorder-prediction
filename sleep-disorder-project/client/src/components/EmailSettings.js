import React, { useState, useEffect } from 'react';
import '../styles/EmailSettings.css';

export default function EmailSettings() {
  const [settings, setSettings] = useState({
    emailAddress: '',
    alertsEnabled: true,
    dailySummary: true,
    dailySummaryTime: '08:00',
    severityThreshold: 'moderate'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/email/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          ...data,
          emailAddress: data.emailAddress || '',
          alertsEnabled: data.alertsEnabled !== undefined ? data.alertsEnabled : true,
          dailySummary: data.dailySummary !== undefined ? data.dailySummary : true,
          dailySummaryTime: data.dailySummaryTime || '08:00',
          severityThreshold: data.severityThreshold || 'moderate'
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/email/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage('✓ Email settings saved successfully');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.emailAddress) {
      setMessage('✗ Please enter an email address first');
      return;
    }

    setTestLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: settings.emailAddress })
      });

      if (response.ok) {
        setMessage('✓ Test email sent successfully');
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="email-settings-container">
      <h2>Email Notifications</h2>

      <div className="settings-form">
        <div className="form-group">
          <label htmlFor="emailAddress">Email Address:</label>
          <input
            id="emailAddress"
            type="email"
            name="emailAddress"
            value={settings.emailAddress}
            onChange={handleChange}
            placeholder="your@email.com"
            disabled={loading}
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="alertsEnabled"
              checked={settings.alertsEnabled}
              onChange={handleChange}
              disabled={loading}
            />
            <span>Enable Alert Notifications</span>
          </label>
          <p className="help-text">Receive immediate alerts when sleep quality issues are detected</p>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="dailySummary"
              checked={settings.dailySummary}
              onChange={handleChange}
              disabled={loading}
            />
            <span>Enable Daily Summary</span>
          </label>
          <p className="help-text">Receive a daily email with your sleep statistics</p>
        </div>

        {settings.dailySummary && (
          <div className="form-group">
            <label htmlFor="dailySummaryTime">Daily Summary Time:</label>
            <input
              id="dailySummaryTime"
              type="time"
              name="dailySummaryTime"
              value={settings.dailySummaryTime}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="severityThreshold">Alert Severity Threshold:</label>
          <select
            id="severityThreshold"
            name="severityThreshold"
            value={settings.severityThreshold}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="critical">Critical Only</option>
            <option value="high">High & Critical</option>
            <option value="moderate">Moderate & Above</option>
            <option value="all">All Alerts</option>
          </select>
          <p className="help-text">Only receive alerts above this severity level</p>
        </div>

        <div className="button-group">
          <button
            onClick={handleSave}
            disabled={loading}
            className="save-button"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={handleTestEmail}
            disabled={testLoading || !settings.emailAddress}
            className="test-button"
          >
            {testLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`email-message ${message.includes('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="email-info">
        <h3>About Email Notifications</h3>
        <ul>
          <li>Alerts are sent immediately when sleep issues are detected</li>
          <li>Daily summaries include sleep quality metrics and trends</li>
          <li>Check your spam folder if you don't see emails</li>
          <li>You can unsubscribe anytime by disabling notifications</li>
        </ul>
      </div>
    </div>
  );
}
