/**
 * Live Monitoring Dashboard Component
 * Real-time visualization of sleep vital signs with WebSocket connection
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Activity, Wifi, WifiOff, AlertTriangle, TrendingUp, Radio } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function LiveMonitoring() {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [liveData, setLiveData] = useState({
        hrv: [],
        spo2: [],
        movement: [],
        breathing: [],
        timestamps: []
    });
    const [currentValues, setCurrentValues] = useState({
        hrv: 0,
        blood_oxygen: 0,
        movement: 0,
        breathing: 0,
        sleepStage: 'Unknown'
    });
    const [alerts, setAlerts] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [analysis, setAnalysis] = useState(null);

    const wsRef = useRef(null);
    const maxDataPoints = 50; // Keep last 50 data points in charts

    // WebSocket connection
    useEffect(() => {
        connectWebSocket();
        return () => {
            disconnectWebSocket();
        };
    }, []);

    const connectWebSocket = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setConnectionStatus('Authentication required');
            return;
        }

        const wsUrl = `ws://localhost:5000/ws?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            setConnectionStatus('Connected - Live monitoring active');
            
            // Subscribe to all data channels
            ws.send(JSON.stringify({
                type: 'subscribe',
                payload: { channels: ['all'] }
            }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setConnectionStatus('Connection error');
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            setConnectionStatus('Disconnected');
            
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (wsRef.current === ws) {
                    console.log('Attempting to reconnect...');
                    connectWebSocket();
                }
            }, 5000);
        };

        wsRef.current = ws;
    }, []);

    const disconnectWebSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const handleWebSocketMessage = (message) => {
        const { type, data, analysis: analysisData, anomalies: anomalyData, timestamp } = message;

        switch (type) {
            case 'connection':
                console.log('Connection confirmed:', message.message);
                break;

            case 'analysis':
                // Real-time analysis result
                if (data) {
                    updateLiveData(data, timestamp);
                    setCurrentValues(data);
                }
                if (analysisData) {
                    setAnalysis(analysisData);
                }
                if (anomalyData && anomalyData.length > 0) {
                    setAnomalies(prev => [...anomalyData, ...prev].slice(0, 10));
                }
                break;

            case 'update':
                // Real-time data update
                if (data) {
                    updateLiveData(data, timestamp);
                    setCurrentValues(data);
                }
                break;

            case 'alert':
                // Critical alert
                addAlert(message);
                break;

            case 'anomaly':
                // Anomaly detected
                addAlert(message);
                break;

            case 'error':
                console.error('Server error:', message.message);
                break;

            default:
                console.log('Unknown message type:', type);
        }
    };

    const updateLiveData = (data, timestamp) => {
        setLiveData(prev => {
            const newData = { ...prev };
            const time = new Date(timestamp || Date.now()).toLocaleTimeString();

            // Add new data points
            newData.hrv = [...prev.hrv, data.hrv].slice(-maxDataPoints);
            newData.spo2 = [...prev.spo2, data.blood_oxygen].slice(-maxDataPoints);
            newData.movement = [...prev.movement, data.movement].slice(-maxDataPoints);
            newData.breathing = [...prev.breathing, data.breathing].slice(-maxDataPoints);
            newData.timestamps = [...prev.timestamps, time].slice(-maxDataPoints);

            return newData;
        });
    };

    const addAlert = (alert) => {
        setAlerts(prev => [{
            ...alert,
            id: Date.now(),
            timestamp: alert.timestamp || new Date().toISOString()
        }, ...prev].slice(0, 20)); // Keep last 20 alerts
    };

    // Simulate wearable device data (for testing)
    const simulateData = () => {
        if (!isConnected) return;

        const simulatedData = {
            hrv: 50 + Math.random() * 30,
            blood_oxygen: 94 + Math.random() * 4,
            movement: Math.random() * 5,
            breathing: 12 + Math.random() * 6,
            sleepStage: ['Awake', 'Light', 'Deep', 'REM'][Math.floor(Math.random() * 4)],
            timestamp: new Date().toISOString()
        };

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'stream',
                payload: simulatedData
            }));
        }
    };

    // Chart configurations
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0 // Disable animation for real-time
        },
        scales: {
            x: {
                display: true,
                title: { display: true, text: 'Time' }
            },
            y: {
                display: true,
                beginAtZero: false
            }
        },
        plugins: {
            legend: { display: true, position: 'top' }
        }
    };

    const spo2ChartData = {
        labels: liveData.timestamps,
        datasets: [{
            label: 'Blood Oxygen (%)',
            data: liveData.spo2,
            borderColor: 'rgb(245, 158, 66)',
            backgroundColor: 'rgba(245, 158, 66, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const hrvChartData = {
        labels: liveData.timestamps,
        datasets: [{
            label: 'HRV (ms)',
            data: liveData.hrv,
            borderColor: 'rgb(37, 99, 235)',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const movementChartData = {
        labels: liveData.timestamps,
        datasets: [{
            label: 'Movement',
            data: liveData.movement,
            borderColor: 'rgb(56, 178, 172)',
            backgroundColor: 'rgba(56, 178, 172, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const breathingChartData = {
        labels: liveData.timestamps,
        datasets: [{
            label: 'Breathing Rate (bpm)',
            data: liveData.breathing,
            borderColor: 'rgb(139, 92, 246)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-red-100 border-red-500 text-red-700';
            case 'high': return 'bg-orange-100 border-orange-500 text-orange-700';
            case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
            case 'low': return 'bg-blue-100 border-blue-500 text-blue-700';
            default: return 'bg-gray-100 border-gray-500 text-gray-700';
        }
    };

    return (
        <div style={{ padding: 'var(--space-xl) 0' }}>
            <div className="container-custom">
                {/* Header */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 'var(--space-lg)',
                        flexWrap: 'wrap'
                    }}>
                        <div>
                            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: '800', marginBottom: 'var(--space-xs)' }} className="text-gradient">
                                Live Monitoring
                            </h1>
                            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                                Real-time sleep vital signs tracking
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: 'var(--space-sm) var(--space-md)',
                                borderRadius: 'var(--radius-full)',
                                background: isConnected ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--destructive) / 0.1)',
                                color: isConnected ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
                                marginBottom: 'var(--space-md)',
                                gap: 'var(--space-xs)'
                            }}>
                                {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                                <span style={{ fontWeight: '600' }}>{connectionStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid-auto-fit" style={{ marginBottom: 'var(--space-2xl)' }}>
                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div className="stat-label">Blood Oxygen</div>
                                <div className="stat-value" style={{ color: '#f59e42' }}>
                                    {currentValues.blood_oxygen.toFixed(1)}%
                                </div>
                            </div>
                            <Activity size={24} style={{ color: '#f59e42' }} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div className="stat-label">Heart Rate Variability</div>
                                <div className="stat-value" style={{ color: '#2563eb' }}>
                                    {currentValues.hrv.toFixed(0)}
                                </div>
                            </div>
                            <Radio size={24} style={{ color: '#2563eb' }} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div className="stat-label">Movement</div>
                                <div className="stat-value">{currentValues.movement.toFixed(1)}</div>
                            </div>
                            <TrendingUp size={24} style={{ color: 'hsl(var(--primary))' }} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div className="stat-label">Breathing Rate</div>
                                <div className="stat-value">{currentValues.breathing.toFixed(0)}</div>
                            </div>
                            <Activity size={24} style={{ color: 'hsl(var(--secondary))' }} />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div className="stat-label">Sleep Stage</div>
                                <div className="stat-value" style={{ fontSize: 'var(--text-2xl)' }}>
                                    {currentValues.sleepStage}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid-auto-fit" style={{ marginBottom: 'var(--space-2xl)' }}>
                    <div className="card">
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-md)' }}>
                            Blood Oxygen Trend
                        </h3>
                        <div style={{ height: '280px' }}>
                            <Line data={spo2ChartData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-md)' }}>
                            Heart Rate Variability
                        </h3>
                        <div style={{ height: '280px' }}>
                            <Line data={hrvChartData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-md)' }}>
                            Movement Activity
                        </h3>
                        <div style={{ height: '280px' }}>
                            <Line data={movementChartData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-md)' }}>
                            Breathing Rate
                        </h3>
                        <div style={{ height: '280px' }}>
                            <Line data={breathingChartData} options={chartOptions} />
                        </div>
                    </div>
                </div>

                {/* Alerts & Anomalies */}
                <div className="grid-auto-fit">
                    {/* Alerts */}
                    <div className="card">
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <AlertTriangle size={20} />
                                Alerts & Notifications
                            </div>
                        </h3>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-sm)',
                            maxHeight: '400px',
                            overflowY: 'auto'
                        }}>
                            {alerts.length === 0 ? (
                                <p style={{
                                    textAlign: 'center',
                                    padding: 'var(--space-2xl) 0',
                                    color: 'hsl(var(--muted-foreground))'
                                }}>
                                    No alerts - All systems normal
                                </p>
                            ) : (
                                alerts.map(alert => (
                                    <div
                                        key={alert.id}
                                        className="alert alert-warning"
                                        style={{ marginBottom: 0 }}
                                    >
                                        <div style={{ fontWeight: '600' }}>{alert.message}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-xs)', opacity: 0.8 }}>
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Anomalies */}
                    <div className="card">
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <TrendingUp size={20} />
                                Detected Anomalies
                            </div>
                        </h3>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-sm)',
                            maxHeight: '400px',
                            overflowY: 'auto'
                        }}>
                            {anomalies.length === 0 ? (
                                <p style={{
                                    textAlign: 'center',
                                    padding: 'var(--space-2xl) 0',
                                    color: 'hsl(var(--muted-foreground))'
                                }}>
                                    No anomalies detected
                                </p>
                            ) : (
                                anomalies.map((anomaly, idx) => (
                                    <div
                                        key={idx}
                                        className="alert alert-danger"
                                        style={{ marginBottom: 0 }}
                                    >
                                        <div style={{ fontWeight: '600' }}>{anomaly.type}</div>
                                        <div style={{ fontSize: 'var(--text-sm)' }}>{anomaly.message}</div>
                                        {anomaly.zScore && (
                                            <div style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-xs)', opacity: 0.8 }}>
                                                Z-score: {anomaly.zScore.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Analysis Result */}
                {analysis && (
                    <div className="card" style={{ marginTop: 'var(--space-2xl)' }}>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-md)' }}>
                            Latest Analysis
                        </h3>
                        <pre style={{
                            background: 'hsl(var(--muted))',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-lg)',
                            overflowX: 'auto',
                            fontSize: 'var(--text-sm)',
                            fontFamily: '"Courier New", monospace'
                        }}>
                            {JSON.stringify(analysis, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LiveMonitoring;
