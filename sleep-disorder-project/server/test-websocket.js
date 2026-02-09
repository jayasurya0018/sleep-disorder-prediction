/**
 * WebSocket Client Test Utility
 * For testing real-time features without frontend
 */

const WebSocket = require('ws');

// Configuration
const WS_URL = 'ws://localhost:5000/ws';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

class WebSocketTester {
    constructor(token) {
        this.token = token;
        this.ws = null;
        this.isConnected = false;
    }

    connect() {
        console.log('Connecting to WebSocket server...');
        this.ws = new WebSocket(`${WS_URL}?token=${this.token}`);

        this.ws.on('open', () => {
            console.log('✓ Connected to WebSocket server');
            this.isConnected = true;
            this.subscribe();
        });

        this.ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
        });

        this.ws.on('error', (error) => {
            console.error('✗ WebSocket error:', error.message);
        });

        this.ws.on('close', () => {
            console.log('✗ WebSocket connection closed');
            this.isConnected = false;
        });
    }

    subscribe() {
        console.log('Subscribing to all channels...');
        this.send({
            type: 'subscribe',
            payload: { channels: ['all'] }
        });
    }

    send(data) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('✗ Not connected to WebSocket');
        }
    }

    handleMessage(message) {
        console.log('\n📨 Received:', message.type);
        
        switch (message.type) {
            case 'connection':
                console.log('✓', message.message);
                break;
            
            case 'subscribed':
                console.log('✓ Subscribed to channels:', message.channels);
                break;
            
            case 'analysis':
                console.log('📊 Analysis Result:');
                if (message.data) {
                    console.log('  Data:', message.data);
                }
                if (message.analysis) {
                    console.log('  Prediction:', message.analysis.prediction);
                }
                if (message.anomalies && message.anomalies.length > 0) {
                    console.log('  ⚠️  Anomalies detected:', message.anomalies.length);
                    message.anomalies.forEach(a => {
                        console.log(`    - ${a.message} (${a.severity})`);
                    });
                }
                break;
            
            case 'alert':
                console.log(`🚨 ALERT [${message.severity}]: ${message.message}`);
                break;
            
            case 'pong':
                console.log('💓 Heartbeat acknowledged');
                break;
            
            case 'error':
                console.error('✗ Server error:', message.message);
                break;
            
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    sendStreamData(data) {
        console.log('\n📤 Sending stream data...');
        this.send({
            type: 'stream',
            payload: {
                hrv: data.hrv || 50 + Math.random() * 30,
                blood_oxygen: data.blood_oxygen || 94 + Math.random() * 4,
                movement: data.movement || Math.random() * 5,
                breathing: data.breathing || 12 + Math.random() * 6,
                sleepStage: data.sleepStage || 'Deep',
                timestamp: new Date().toISOString()
            }
        });
    }

    sendBatchData(dataArray) {
        console.log(`\n📦 Sending batch data (${dataArray.length} items)...`);
        this.send({
            type: 'batch',
            payload: { data: dataArray }
        });
    }

    ping() {
        console.log('\n💓 Sending ping...');
        this.send({ type: 'ping' });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }

    // Automated test scenarios
    runTestScenarios() {
        console.log('\n🧪 Starting automated test scenarios...\n');

        // Test 1: Normal data
        setTimeout(() => {
            console.log('TEST 1: Normal sleep data');
            this.sendStreamData({
                hrv: 60,
                blood_oxygen: 97,
                movement: 1.5,
                breathing: 14,
                sleepStage: 'Deep'
            });
        }, 2000);

        // Test 2: Low SpO2 (should trigger anomaly)
        setTimeout(() => {
            console.log('TEST 2: Low blood oxygen');
            this.sendStreamData({
                hrv: 55,
                blood_oxygen: 89, // Low!
                movement: 2,
                breathing: 15,
                sleepStage: 'Light'
            });
        }, 4000);

        // Test 3: Critical SpO2 (should trigger critical alert)
        setTimeout(() => {
            console.log('TEST 3: CRITICAL blood oxygen');
            this.sendStreamData({
                hrv: 45,
                blood_oxygen: 85, // Critical!
                movement: 5,
                breathing: 18,
                sleepStage: 'Awake'
            });
        }, 6000);

        // Test 4: Low HRV
        setTimeout(() => {
            console.log('TEST 4: Low HRV');
            this.sendStreamData({
                hrv: 18, // Very low!
                blood_oxygen: 96,
                movement: 1,
                breathing: 13,
                sleepStage: 'REM'
            });
        }, 8000);

        // Test 5: Batch data
        setTimeout(() => {
            console.log('TEST 5: Batch upload');
            const batchData = [];
            for (let i = 0; i < 5; i++) {
                batchData.push({
                    hrv: 50 + Math.random() * 20,
                    blood_oxygen: 95 + Math.random() * 3,
                    movement: Math.random() * 3,
                    breathing: 13 + Math.random() * 4,
                    sleepStage: ['Deep', 'Light', 'REM'][Math.floor(Math.random() * 3)],
                    timestamp: new Date(Date.now() - (5 - i) * 60000).toISOString()
                });
            }
            this.sendBatchData(batchData);
        }, 10000);

        // Test 6: Heartbeat
        setTimeout(() => {
            console.log('TEST 6: Heartbeat check');
            this.ping();
        }, 12000);

        // Cleanup
        setTimeout(() => {
            console.log('\n✓ All tests completed');
            console.log('Press Ctrl+C to exit or send more data manually');
        }, 14000);
    }
}

// Main execution
if (require.main === module) {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('==========================================');
    console.log('WebSocket Real-Time Testing Utility');
    console.log('==========================================\n');

    rl.question('Enter your JWT token: ', (token) => {
        if (!token || token.trim() === '') {
            console.error('Error: Token is required');
            process.exit(1);
        }

        const tester = new WebSocketTester(token.trim());
        tester.connect();

        // Wait for connection before running tests
        setTimeout(() => {
            if (tester.isConnected) {
                tester.runTestScenarios();
            } else {
                console.error('Failed to connect. Check token and server status.');
                process.exit(1);
            }
        }, 1000);

        // Interactive mode
        rl.on('line', (input) => {
            const cmd = input.trim().toLowerCase();
            
            if (cmd === 'quit' || cmd === 'exit') {
                tester.disconnect();
                process.exit(0);
            } else if (cmd === 'test') {
                tester.runTestScenarios();
            } else if (cmd === 'ping') {
                tester.ping();
            } else if (cmd === 'send') {
                tester.sendStreamData({});
            } else if (cmd === 'help') {
                console.log('\nCommands:');
                console.log('  send  - Send random stream data');
                console.log('  test  - Run all test scenarios');
                console.log('  ping  - Send heartbeat');
                console.log('  quit  - Exit');
            } else if (cmd) {
                console.log('Unknown command. Type "help" for available commands.');
            }
        });

        console.log('\nType "help" for available commands\n');
    });
}

module.exports = WebSocketTester;
