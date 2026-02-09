import React, { useState, useEffect, useRef } from 'react';
import '../styles/WearableDevices.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const WS_BASE = API_BASE.replace(/\/api\/?$/, '').replace('http', 'ws');

export default function WearableDevices() {
  const [devices, setDevices] = useState({
    fitbit: { token: '', connected: false },
    oura: { token: '', connected: false },
    garmin: { token: '', connected: false },
    zepp: { token: '', connected: false },
    mifitness: { token: '', connected: false }
  });
  const [streamingStatus, setStreamingStatus] = useState('stopped');
  const [loading, setLoading] = useState({});
  const [message, setMessage] = useState('');
  const [liveData, setLiveData] = useState(null);
  const [dataHistory, setDataHistory] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Check for OAuth callback success/error
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success) {
      setMessage(`✓ ${success.toUpperCase()} connected successfully!`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      setMessage(`✗ Connection error: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchWearableStatus();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchWearableStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/oauth/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const connectedDevices = data.devices || {};
        
        setDevices(prev => ({
          fitbit: { ...prev.fitbit, connected: !!connectedDevices.fitbit },
          oura: { ...prev.oura, connected: !!connectedDevices.oura },
          garmin: { ...prev.garmin, connected: !!connectedDevices.garmin },
          zepp: { ...prev.zepp, connected: !!connectedDevices.zepp },
          mifitness: { ...prev.mifitness, connected: !!connectedDevices.mifitness }
        }));
      }
    } catch (error) {
      console.error('Error fetching wearable status:', error);
    }
  };

  const handleTokenChange = (device, value) => {
    setDevices(prev => ({
      ...prev,
      [device]: { ...prev[device], token: value }
    }));
  };

  const handleConnectDevice = async (device) => {
    setLoading(prev => ({ ...prev, [device]: true }));
    
    try {
      const token = localStorage.getItem('token');
      
      // Redirect to OAuth authorization with token in query param
      window.location.href = `${API_BASE}/oauth/authorize/${device}?token=${encodeURIComponent(token)}`;
      
    } catch (error) {
      console.error('Connection error:', error);
      setMessage(`✗ Failed to initiate ${device} connection`);
      setLoading(prev => ({ ...prev, [device]: false }));
    }
  };

  const handleDisconnectDevice = async (device) => {
    setLoading(prev => ({ ...prev, [device]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/oauth/disconnect/${device}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage(`✓ ${device.toUpperCase()} disconnected`);
        setDevices(prev => ({
          ...prev,
          [device]: { ...prev[device], connected: false }
        }));
      }
    } catch (error) {
      console.error('Disconnection error:', error);
      setMessage(`✗ Failed to disconnect ${device}`);
    } finally {
      setLoading(prev => ({ ...prev, [device]: false }));
    }
  };

  const handleStartStreaming = async () => {
    const connectedDevices = Object.keys(devices).filter(d => devices[d].connected);
    
    if (connectedDevices.length === 0) {
      setMessage('✗ Please connect at least one device first');
      return;
    }

    setLoading(prev => ({ ...prev, streaming: true }));

    try {
      const token = localStorage.getItem('token');
      
      // Connect to WebSocket
      const wsToken = encodeURIComponent(token);
      const wsUrl = `${WS_BASE}/ws?token=${wsToken}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setStreamingStatus('running');
        setMessage('✓ Real-time streaming started via WebSocket');
        
        // Send command to start wearable polling
        wsRef.current.send(JSON.stringify({
          type: 'start_wearable',
          payload: { interval: 5 }
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'wearable_data') {
            setLiveData(msg.data);
            setDataHistory(prev => [msg.data, ...prev].slice(0, 50)); // Keep last 50 data points
          } else if (msg.type === 'polling_started') {
            setMessage(`✓ ${msg.message}`);
          } else if (msg.type === 'anomaly') {
            setMessage(`⚠ Anomaly detected: ${msg.message}`);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setMessage('✗ WebSocket connection error');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };

    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, streaming: false }));
    }
  };

  const handleStopStreaming = async () => {
    setLoading(prev => ({ ...prev, streaming: true }));

    try {
      // Send stop command via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'stop_wearable'
        }));
        
        // Close WebSocket after a short delay
        setTimeout(() => {
          wsRef.current.close();
          wsRef.current = null;
        }, 500);
      }

      setStreamingStatus('stopped');
      setMessage('✓ Real-time streaming stopped');
      setLiveData(null);

    } catch (error) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, streaming: false }));
    }
  };

  return (
    <div className="wearable-devices-container">
      <h2>Connected Wearable Devices</h2>

      <div className="devices-grid">
        {['fitbit', 'oura', 'garmin', 'zepp', 'mifitness'].map(device => (
          <div key={device} className={`device-card ${devices[device].connected ? 'connected' : ''}`}>
            <div className="device-header">
              <h3>{device === 'zepp' ? 'ZEPP LIFE' : device === 'mifitness' ? 'MI FITNESS' : device.toUpperCase()}</h3>
              <span className={`status-badge ${devices[device].connected ? 'active' : 'inactive'}`}>
                {devices[device].connected ? '● Connected' : '○ Disconnected'}
              </span>
            </div>

            <div className="device-body">
              <p className="oauth-info">
                {devices[device].connected 
                  ? '✅ Connected via OAuth2 - Auto-refreshing tokens' 
                  : '🔐 Click Connect to authorize via OAuth2'}
              </p>

              <button
                onClick={() => {
                  if (devices[device].connected) {
                    handleDisconnectDevice(device);
                  } else {
                    handleConnectDevice(device);
                  }
                }}
                disabled={loading[device]}
                className={`connect-button ${devices[device].connected ? 'disconnect' : 'connect'}`}
              >
                {loading[device]
                  ? 'Processing...'
                  : devices[device].connected
                  ? 'Disconnect'
                  : 'Connect'
                }
              </button>
            </div>

            <div className="device-info">
              {device === 'fitbit' && (
                <p>Connect your Fitbit device to stream real-time heart rate, steps, and sleep data</p>
              )}
              {device === 'oura' && (
                <p>Connect your Oura Ring for advanced sleep and recovery metrics</p>
              )}
              {device === 'garmin' && (
                <p>Connect your Garmin watch for comprehensive health and activity tracking</p>
              )}
              {device === 'zepp' && (
                <p>Connect your Zepp Life smartwatch for heart rate, sleep, SpO2, and stress monitoring</p>
              )}
              {device === 'mifitness' && (
                <p>Connect your Mi Fitness band for activity, heart rate, sleep, and SpO2 tracking</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="streaming-controls">
        <h3>Real-Time Data Streaming</h3>
        <div className="streaming-status">
          <span className={`status ${streamingStatus}`}>
            {streamingStatus === 'running' ? '● Streaming Active' : '○ Streaming Inactive'}
          </span>
        </div>

        <div className="streaming-buttons">
          <button
            onClick={handleStartStreaming}
            disabled={streamingStatus === 'running' || loading.streaming}
            className="start-button"
          >
            {loading.streaming ? 'Starting...' : 'Start Streaming'}
          </button>
          <button
            onClick={handleStopStreaming}
            disabled={streamingStatus === 'stopped' || loading.streaming}
            className="stop-button"
          >
            {loading.streaming ? 'Stopping...' : 'Stop Streaming'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`wearable-message ${message.includes('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {liveData && streamingStatus === 'running' && (
        <div className="live-data-section">
          <h3>📊 Live Wearable Data</h3>
          <div className="live-data-grid">
            <div className="live-data-card">
              <div className="metric-label">Heart Rate Variability</div>
              <div className="metric-value">{liveData.hrv?.toFixed(1) || '--'}</div>
              <div className="metric-unit">ms</div>
            </div>
            <div className="live-data-card">
              <div className="metric-label">Blood Oxygen</div>
              <div className="metric-value">{liveData.blood_oxygen?.toFixed(1) || '--'}</div>
              <div className="metric-unit">%</div>
            </div>
            <div className="live-data-card">
              <div className="metric-label">Movement</div>
              <div className="metric-value">{liveData.movement?.toFixed(2) || '--'}</div>
              <div className="metric-unit">accel</div>
            </div>
            <div className="live-data-card">
              <div className="metric-label">Breathing Rate</div>
              <div className="metric-value">{liveData.breathing?.toFixed(0) || '--'}</div>
              <div className="metric-unit">breaths/min</div>
            </div>
            <div className="live-data-card">
              <div className="metric-label">Sleep Stage</div>
              <div className="metric-value">{liveData.sleepStage || '--'}</div>
              <div className="metric-unit"></div>
            </div>
            <div className="live-data-card">
              <div className="metric-label">Source</div>
              <div className="metric-value">{liveData.source?.toUpperCase() || '--'}</div>
              <div className="metric-unit"></div>
            </div>
          </div>
          {dataHistory.length > 0 && (
            <div className="data-history">
              <p className="history-info">Last {dataHistory.length} readings recorded</p>
            </div>
          )}
        </div>
      )}

      <div className="wearable-help">
        <h3>How to Get Access Tokens</h3>
        <ul>
          <li><strong>Fitbit:</strong> Visit <code>https://dev.fitbit.com</code> and create an OAuth 2.0 app</li>
          <li><strong>Oura:</strong> Get your personal access token from <code>https://cloud.ouraring.com</code></li>
          <li><strong>Garmin:</strong> Create an API key at <code>https://developer.garmin.com</code></li>
        </ul>
      </div>
    </div>
  );
}
