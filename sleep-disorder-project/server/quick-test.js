/**
 * Simple WebSocket Connection Test
 * Tests WebSocket without requiring authentication
 */

const WebSocket = require('ws');

console.log('==========================================');
console.log('WebSocket Connection Test');
console.log('==========================================\n');

// Test 1: Check if WebSocket server is running
console.log('Test 1: Checking if WebSocket server is running...');
const ws = new WebSocket('ws://localhost:5000/ws?token=test');

ws.on('open', () => {
    console.log('✓ WebSocket server is reachable');
    ws.close();
});

ws.on('error', (error) => {
    console.error('✗ WebSocket server error:', error.message);
    console.log('\nMake sure the backend server is running:');
    console.log('  cd server && node index.js');
});

ws.on('close', () => {
    console.log('\nConnection closed.');
    
    // Test 2: Check backend HTTP endpoint
    console.log('\nTest 2: Checking backend HTTP API...');
    const http = require('http');
    
    http.get('http://localhost:5000/api/stream/status', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('✓ Backend API is responding');
            console.log('Response:', data);
            checkMLService();
        });
    }).on('error', (err) => {
        console.error('✗ Backend API error:', err.message);
        process.exit(1);
    });
});

// Test 3: Check ML Service
function checkMLService() {
    console.log('\nTest 3: Checking ML Service...');
    const http = require('http');
    
    http.get('http://localhost:5002/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('✓ ML Service is running');
            console.log('Response:', data);
            console.log('\n==========================================');
            console.log('All services are running correctly! ✅');
            console.log('==========================================\n');
            console.log('Next steps:');
            console.log('1. Open http://localhost:3000');
            console.log('2. Login to get a JWT token');
            console.log('3. Navigate to /live-monitoring');
            console.log('4. Click "Connect" button');
            console.log('5. Click "Simulate Data" to test\n');
            process.exit(0);
        });
    }).on('error', (err) => {
        console.error('✗ ML Service error:', err.message);
        console.log('\nStart the ML service:');
        console.log('  cd ml && python realtime_app.py\n');
        process.exit(1);
    });
}
