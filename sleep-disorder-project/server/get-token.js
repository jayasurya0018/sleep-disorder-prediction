#!/usr/bin/env node
/**
 * Automatic Login and Token Generator
 * Creates a test user and generates JWT token for WebSocket testing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function getToken() {
    console.log('==========================================');
    console.log('JWT Token Generator');
    console.log('==========================================\n');

    // Try with different test users to find one that works
    const testUsers = [
        { email: 'realtime@test.com', password: 'realtime123', name: 'Realtime Test' },
        { email: 'test@example.com', password: 'test123456', name: 'Test User' },
        { email: 'demo@sleep.com', password: 'demo123456', name: 'Demo User' }
    ];

    for (const testUser of testUsers) {
        try {
            // Try to login first
            console.log(`Attempting to login as ${testUser.email}...`);
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });

            console.log('✓ Login successful!');
            console.log('\nYour JWT Token:');
            console.log('─────────────────────────────────────────');
            console.log(loginRes.data.token);
            console.log('─────────────────────────────────────────\n');
            
            return loginRes.data.token;

        } catch (error) {
            if (error.response && error.response.status === 401) {
                // User doesn't exist, try to register
                console.log('User not found, creating new account...');
                
                try {
                    const registerRes = await axios.post(`${BASE_URL}/auth/register`, testUser);
                    
                    console.log('✓ Account created successfully!');
                    console.log('\nYour JWT Token:');
                    console.log('─────────────────────────────────────────');
                    console.log(registerRes.data.token);
                    console.log('─────────────────────────────────────────\n');
                    
                    return registerRes.data.token;
                    
                } catch (regError) {
                    console.log(`✗ Failed to create ${testUser.email}, trying next...`);
                    continue;
                }
            } else {
                console.log(`✗ Error with ${testUser.email}, trying next...`);
                continue;
            }
        }
    }
    
    throw new Error('Could not login or register with any test account');
}

async function testWebSocket(token) {
    const WebSocket = require('ws');
    
    console.log('Testing WebSocket connection...\n');
    
    const ws = new WebSocket(`ws://localhost:5000/ws?token=${token}`);
    
    ws.on('open', () => {
        console.log('✓ WebSocket connected successfully!\n');
        
        // Send a test message
        console.log('Sending test data...');
        ws.send(JSON.stringify({
            type: 'stream',
            payload: {
                hrv: 55,
                blood_oxygen: 96,
                movement: 2,
                breathing: 14,
                sleepStage: 'Deep',
                timestamp: new Date().toISOString()
            }
        }));
    });
    
    ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('📨 Received:', message.type);
        
        if (message.type === 'analysis') {
            console.log('✓ Real-time analysis working!');
            console.log('\nAnalysis Result:');
            console.log(JSON.stringify(message.analysis, null, 2));
            
            setTimeout(() => {
                console.log('\n==========================================');
                console.log('WebSocket Test Successful! ✅');
                console.log('==========================================\n');
                console.log('Use this token in your browser:');
                console.log('localStorage.setItem("token", "' + token + '");\n');
                ws.close();
                process.exit(0);
            }, 2000);
        }
    });
    
    ws.on('error', (error) => {
        console.error('✗ WebSocket error:', error.message);
        process.exit(1);
    });
}

async function main() {
    try {
        const token = await getToken();
        
        console.log('Commands to use this token:\n');
        console.log('1. In browser console:');
        console.log('   localStorage.setItem("token", "' + token + '");\n');
        console.log('2. For WebSocket testing:');
        console.log('   node test-websocket.js');
        console.log('   Then paste the token above\n');
        
        console.log('Testing WebSocket with this token...\n');
        await testWebSocket(token);
        
    } catch (error) {
        console.error('\n✗ Test failed. Make sure:');
        console.error('  1. Backend server is running (node index.js)');
        console.error('  2. ML service is running (python realtime_app.py)');
        console.error('  3. MongoDB is connected\n');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getToken };
