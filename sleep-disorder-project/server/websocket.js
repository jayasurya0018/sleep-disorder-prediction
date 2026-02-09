/**
 * WebSocket Server for Real-Time Sleep Data Streaming
 * Handles live data from wearable devices and broadcasts to connected clients
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { analyzeRealTime, detectAnomalies } = require('./services/streamingService');
const wearableService = require('./services/wearableService');

let wss = null;
const clients = new Map(); // userId -> Set of WebSocket connections
const activeStreams = new Map(); // userId -> {device, intervalId, ws}

/**
 * Initialize WebSocket server
 */
function initializeWebSocket(server) {
    wss = new WebSocket.Server({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        console.log('New WebSocket connection');

        // Extract token from query params or headers
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token') || req.headers['sec-websocket-protocol'];

        let userId = null;

        // Authenticate the connection
        try {
            if (token) {
                const jwtSecret = process.env.JWT_SECRET;
                if (!jwtSecret) {
                    console.error('JWT_SECRET not set; refusing WebSocket connection');
                    ws.send(JSON.stringify({ type: 'error', message: 'Server auth misconfigured' }));
                    ws.close();
                    return;
                }

                const decoded = jwt.verify(token, jwtSecret);
                userId = decoded.userId;
                ws.userId = userId;

                // Store client connection
                if (!clients.has(userId)) {
                    clients.set(userId, new Set());
                }
                clients.get(userId).add(ws);

                console.log(`User ${userId} connected via WebSocket`);
                
                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'connection',
                    status: 'connected',
                    message: 'Real-time monitoring active',
                    timestamp: new Date().toISOString()
                }));
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
                ws.close();
                return;
            }
        } catch (error) {
            console.error('WebSocket authentication failed:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
            ws.close();
            return;
        }

        // Handle incoming messages
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                await handleIncomingData(ws, userId, data);
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Failed to process data',
                    error: error.message 
                }));
            }
        });

        // Handle disconnection
        ws.on('close', () => {
            console.log(`User ${userId} disconnected`);
            if (userId && clients.has(userId)) {
                clients.get(userId).delete(ws);
                if (clients.get(userId).size === 0) {
                    clients.delete(userId);
                    // Stop polling when last client disconnects
                    stopWearablePolling(userId);
                }
            }
        });

        // Handle errors
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        // Heartbeat to keep connection alive
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });
    });

    // Ping clients every 30 seconds to detect broken connections
    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(heartbeatInterval);
    });

    console.log('WebSocket server initialized');
    return wss;
}

/**
 * Handle incoming streaming data from wearable devices
 */
async function handleIncomingData(ws, userId, data) {
    const { type, payload } = data;

    switch (type) {
        case 'stream':
            // Real-time vital signs data
            await handleStreamData(ws, userId, payload);
            break;

        case 'batch':
            // Batch data upload from device
            await handleBatchData(ws, userId, payload);
            break;

        case 'start_wearable':
            // Start polling wearable device
            const interval = payload?.interval || 5;
            startWearablePolling(userId, ws, interval);
            break;

        case 'stop_wearable':
            // Stop polling wearable device
            stopWearablePolling(userId);
            ws.send(JSON.stringify({
                type: 'polling_stopped',
                message: 'Wearable polling stopped'
            }));
            break;

        case 'ping':
            // Client heartbeat
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;

        case 'subscribe':
            // Subscribe to specific data channels
            handleSubscription(ws, userId, payload);
            break;

        default:
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: `Unknown message type: ${type}` 
            }));
    }
}

/**
 * Handle real-time streaming data
 */
async function handleStreamData(ws, userId, payload) {
    const { hrv, blood_oxygen, movement, breathing, sleepStage, timestamp } = payload;

    // Validate incoming data
    if (!hrv || !blood_oxygen || !movement || !breathing) {
        ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Missing required fields in stream data' 
        }));
        return;
    }

    // Store in streaming buffer
    const streamData = {
        userId,
        hrv: parseFloat(hrv),
        blood_oxygen: parseFloat(blood_oxygen),
        movement: parseFloat(movement),
        breathing: parseFloat(breathing),
        sleepStage: sleepStage || 'Unknown',
        timestamp: timestamp || new Date().toISOString()
    };

    try {
        // Perform real-time analysis
        const analysis = await analyzeRealTime(streamData);

        // Detect anomalies
        const anomalies = await detectAnomalies(streamData);

        // Send analysis back to client
        ws.send(JSON.stringify({
            type: 'analysis',
            data: streamData,
            analysis,
            anomalies,
            timestamp: new Date().toISOString()
        }));

        // Broadcast to all client connections for this user
        broadcastToUser(userId, {
            type: 'update',
            data: streamData,
            analysis,
            anomalies
        });

        // Send alerts if anomalies detected
        if (anomalies && anomalies.length > 0) {
            sendAlert(userId, {
                type: 'anomaly',
                severity: anomalies[0].severity,
                message: anomalies[0].message,
                data: streamData,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Error in real-time analysis:', error);
        ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Analysis failed',
            error: error.message 
        }));
    }
}

/**
 * Handle batch data upload
 */
async function handleBatchData(ws, userId, payload) {
    // Process batch of historical data
    const { data } = payload;
    
    if (!Array.isArray(data)) {
        ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Batch data must be an array' 
        }));
        return;
    }

    ws.send(JSON.stringify({
        type: 'batch_received',
        count: data.length,
        message: 'Processing batch data',
        timestamp: new Date().toISOString()
    }));

    // Process each data point
    for (const item of data) {
        await handleStreamData(ws, userId, item);
    }

    ws.send(JSON.stringify({
        type: 'batch_complete',
        count: data.length,
        timestamp: new Date().toISOString()
    }));
}

/**
 * Handle subscription requests
 */
function handleSubscription(ws, userId, payload) {
    const { channels } = payload;
    ws.subscriptions = new Set(channels || ['all']);
    
    ws.send(JSON.stringify({
        type: 'subscribed',
        channels: Array.from(ws.subscriptions),
        timestamp: new Date().toISOString()
    }));
}

/**
 * Broadcast message to all connections for a specific user
 */
function broadcastToUser(userId, message) {
    if (!clients.has(userId)) return;

    const userClients = clients.get(userId);
    userClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

/**
 * Send alert notification to user
 */
function sendAlert(userId, alert) {
    broadcastToUser(userId, {
        type: 'alert',
        ...alert
    });
}

/**
 * Broadcast to all connected clients
 */
function broadcastAll(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

/**
 * Get connected clients count
 */
function getConnectedClientsCount() {
    return wss ? wss.clients.size : 0;
}

/**
 * Get connected users count
 */
function getConnectedUsersCount() {
    return clients.size;
}

/**
 * Start polling wearable device data
 */
function startWearablePolling(userId, ws, intervalSeconds = 5) {
    try {
        const status = wearableService.getConnectionStatus(userId);
        if (!status.connected) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'No wearable device connected'
            }));
            return;
        }

        // Stop existing polling if any
        stopWearablePolling(userId);

        // Start new polling interval
        const intervalId = setInterval(async () => {
            try {
                let data;
                if (status.device === 'fitbit') {
                    data = await wearableService.fetchFitbitData(userId);
                } else if (status.device === 'oura') {
                    data = await wearableService.fetchOuraData(userId);
                } else if (status.device === 'garmin') {
                    data = await wearableService.fetchGarminData(userId);
                }

                if (data) {
                    // Perform real-time analysis
                    const analysis = await analyzeRealTime(data);
                    const anomalies = await detectAnomalies(data);

                    // Broadcast to all user clients
                    broadcastToUser(userId, {
                        type: 'wearable_data',
                        data: data,
                        analysis: analysis,
                        anomalies: anomalies,
                        timestamp: new Date().toISOString()
                    });

                    // Send alerts if anomalies detected
                    if (anomalies && anomalies.length > 0) {
                        sendAlert(userId, {
                            type: 'anomaly',
                            severity: anomalies[0].severity,
                            message: anomalies[0].message,
                            data: data,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            } catch (error) {
                console.error('Wearable polling error:', error.message);
                broadcastToUser(userId, {
                    type: 'polling_error',
                    message: error.message
                });
            }
        }, intervalSeconds * 1000);

        activeStreams.set(userId, {
            device: status.device,
            intervalId: intervalId,
            startedAt: new Date()
        });

        console.log(`Started wearable polling for user ${userId} on ${status.device}`);

        ws.send(JSON.stringify({
            type: 'polling_started',
            device: status.device,
            interval: intervalSeconds,
            message: `Polling ${status.device} data every ${intervalSeconds}s`
        }));

    } catch (error) {
        console.error('Failed to start wearable polling:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to start polling: ' + error.message
        }));
    }
}

/**
 * Stop polling wearable device data
 */
function stopWearablePolling(userId) {
    const stream = activeStreams.get(userId);
    if (stream && stream.intervalId) {
        clearInterval(stream.intervalId);
        activeStreams.delete(userId);
        console.log(`Stopped wearable polling for user ${userId}`);
        
        broadcastToUser(userId, {
            type: 'polling_stopped',
            message: 'Wearable data polling stopped'
        });
    }
}

module.exports = {
    initializeWebSocket,
    broadcastToUser,
    sendAlert,
    broadcastAll,
    startWearablePolling,
    stopWearablePolling,
    getConnectedClientsCount,
    getConnectedUsersCount
};
