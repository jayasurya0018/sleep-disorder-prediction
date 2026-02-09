/**
 * Wearable Device Integration Service
 * Supports Fitbit, Oura Ring, Garmin, Zepp Life, Mi Fitness, and more
 */

const axios = require('axios');
const { getValidAccessToken } = require('../routes/oauthRoutes');

// Wearable device configurations
const DEVICE_CONFIGS = {
    fitbit: {
        name: 'Fitbit',
        authUrl: 'https://www.fitbit.com/oauth2/authorize',
        tokenUrl: 'https://api.fitbit.com/oauth2/token',
        apiBase: 'https://api.fitbit.com/1',
        scopes: ['heartrate', 'oxygen_saturation', 'activity', 'sleep']
    },
    oura: {
        name: 'Oura Ring',
        apiBase: 'https://api.ouraring.com/v2',
        scopes: ['daily', 'heartrate', 'workout', 'sleep']
    },
    garmin: {
        name: 'Garmin',
        apiBase: 'https://apis.garmin.com',
        scopes: ['wellness', 'activities']
    },
    zepp: {
        name: 'Zepp Life',
        apiBase: 'https://api.zepp.com/healthkit/v1',
        scopes: ['heart_rate', 'sleep', 'spo2', 'stress']
    },
    mifitness: {
        name: 'Mi Fitness',
        apiBase: 'https://api.xiaomi.com/mfit/v1',
        scopes: ['heart_rate', 'sleep', 'steps', 'spo2']
    }
};

class WearableService {
    constructor() {
        this.activeConnections = new Map(); // userId -> device connection
        this.pollingIntervals = new Map(); // userId -> interval ID
    }

    /**
     * Connect to Fitbit device
     */
    async connectFitbit(userId, accessToken) {
        try {
            // Verify token
            const userProfile = await axios.get(`${DEVICE_CONFIGS.fitbit.apiBase}/user/-/profile.json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            this.activeConnections.set(userId, {
                device: 'fitbit',
                accessToken,
                userId: userProfile.data.user.encodedId,
                connected: true,
                connectedAt: new Date()
            });

            console.log(`Fitbit connected for user ${userId}`);
            return { success: true, device: 'fitbit' };

        } catch (error) {
            console.error('Fitbit connection error:', error.message);
            throw new Error('Failed to connect Fitbit: ' + error.message);
        }
    }

    /**
     * Connect to Oura Ring
     */
    async connectOura(userId, accessToken) {
        try {
            // Verify token with personal info endpoint
            const response = await axios.get(`${DEVICE_CONFIGS.oura.apiBase}/usercollection/personal_info`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            this.activeConnections.set(userId, {
                device: 'oura',
                accessToken,
                userId: response.data.id,
                connected: true,
                connectedAt: new Date()
            });

            console.log(`Oura Ring connected for user ${userId}`);
            return { success: true, device: 'oura' };

        } catch (error) {
            console.error('Oura connection error:', error.message);
            throw new Error('Failed to connect Oura Ring: ' + error.message);
        }
    }

    /**
     * Connect to Zepp Life
     */
    async connectZepp(userId, accessToken) {
        try {
            // Verify token by fetching user info
            const response = await axios.get(`${DEVICE_CONFIGS.zepp.apiBase}/user/profile`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            this.activeConnections.set(userId, {
                device: 'zepp',
                accessToken,
                userId: response.data.userId,
                connected: true,
                connectedAt: new Date()
            });

            console.log(`Zepp Life connected for user ${userId}`);
            return { success: true, device: 'zepp' };

        } catch (error) {
            console.error('Zepp Life connection error:', error.message);
            throw new Error('Failed to connect Zepp Life: ' + error.message);
        }
    }

    /**
     * Connect to Mi Fitness
     */
    async connectMiFitness(userId, accessToken) {
        try {
            // Verify token by fetching user info
            const response = await axios.get(`${DEVICE_CONFIGS.mifitness.apiBase}/user/profile`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            this.activeConnections.set(userId, {
                device: 'mifitness',
                accessToken,
                userId: response.data.userId,
                connected: true,
                connectedAt: new Date()
            });

            console.log(`Mi Fitness connected for user ${userId}`);
            return { success: true, device: 'mifitness' };

        } catch (error) {
            console.error('Mi Fitness connection error:', error.message);
            throw new Error('Failed to connect Mi Fitness: ' + error.message);
        }
    }

    /**
     * Fetch real-time data from Fitbit
     */
    async fetchFitbitData(userId) {
        const connection = this.activeConnections.get(userId);
        if (!connection || connection.device !== 'fitbit') {
            throw new Error('Fitbit not connected');
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch heart rate data
            const hrData = await axios.get(
                `${DEVICE_CONFIGS.fitbit.apiBase}/user/-/activities/heart/date/${today}/1d/1sec.json`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch SpO2 data
            const spo2Data = await axios.get(
                `${DEVICE_CONFIGS.fitbit.apiBase}/user/-/spo2/date/${today}.json`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch activity data
            const activityData = await axios.get(
                `${DEVICE_CONFIGS.fitbit.apiBase}/user/-/activities/date/${today}.json`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch sleep data
            const sleepData = await axios.get(
                `${DEVICE_CONFIGS.fitbit.apiBase}/user/-/sleep/date/${today}.json`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Transform to our format
            return this.transformFitbitData(hrData.data, spo2Data.data, activityData.data, sleepData.data);

        } catch (error) {
            console.error('Fitbit data fetch error:', error.message);
            return null;
        }
    }

    /**
     * Fetch data from Oura Ring
     */
    async fetchOuraData(userId) {
        const connection = this.activeConnections.get(userId);
        if (!connection || connection.device !== 'oura') {
            throw new Error('Oura Ring not connected');
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch sleep data
            const sleepResponse = await axios.get(
                `${DEVICE_CONFIGS.oura.apiBase}/usercollection/sleep?start_date=${today}&end_date=${today}`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch readiness data
            const readinessResponse = await axios.get(
                `${DEVICE_CONFIGS.oura.apiBase}/usercollection/daily_readiness?start_date=${today}&end_date=${today}`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            return this.transformOuraData(sleepResponse.data, readinessResponse.data);

        } catch (error) {
            console.error('Oura data fetch error:', error.message);
            return null;
        }
    }

    /**
     * Fetch data from Zepp Life
     */
    async fetchZeppData(userId) {
        const connection = this.activeConnections.get(userId);
        if (!connection || connection.device !== 'zepp') {
            throw new Error('Zepp Life not connected');
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch heart rate data
            const hrResponse = await axios.get(
                `${DEVICE_CONFIGS.zepp.apiBase}/user/heart_rate/today`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch sleep data
            const sleepResponse = await axios.get(
                `${DEVICE_CONFIGS.zepp.apiBase}/user/sleep/today`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch SpO2 data
            const spo2Response = await axios.get(
                `${DEVICE_CONFIGS.zepp.apiBase}/user/spo2/today`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch stress data
            const stressResponse = await axios.get(
                `${DEVICE_CONFIGS.zepp.apiBase}/user/stress/today`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            return this.transformZeppData(hrResponse.data, sleepResponse.data, spo2Response.data, stressResponse.data);

        } catch (error) {
            console.error('Zepp Life data fetch error:', error.message);
            return null;
        }
    }

    /**
     * Fetch data from Mi Fitness
     */
    async fetchMiFitnessData(userId) {
        const connection = this.activeConnections.get(userId);
        if (!connection || connection.device !== 'mifitness') {
            throw new Error('Mi Fitness not connected');
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch heart rate data
            const hrResponse = await axios.get(
                `${DEVICE_CONFIGS.mifitness.apiBase}/user/heart_rate/today`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch sleep data
            const sleepResponse = await axios.get(
                `${DEVICE_CONFIGS.mifitness.apiBase}/user/sleep/today`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch SpO2 data
            const spo2Response = await axios.get(
                `${DEVICE_CONFIGS.mifitness.apiBase}/user/spo2/today`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            // Fetch steps data
            const stepsResponse = await axios.get(
                `${DEVICE_CONFIGS.mifitness.apiBase}/user/steps/today`,
                { headers: { 'Authorization': `Bearer ${connection.accessToken}` } }
            );

            return this.transformMiFitnessData(hrResponse.data, sleepResponse.data, spo2Response.data, stepsResponse.data);

        } catch (error) {
            console.error('Mi Fitness data fetch error:', error.message);
            return null;
        }
    }

    /**
     * Transform Fitbit data to our format
     */
    transformFitbitData(hrData, spo2Data, activityData, sleepData) {
        const latestHR = hrData['activities-heart-intraday']?.dataset?.slice(-1)[0];
        const latestSpo2 = spo2Data.value || 96;
        const steps = activityData.summary?.steps || 0;
        const currentSleep = sleepData.sleep?.[0];

        return {
            hrv: latestHR?.value ? this.calculateHRV(latestHR.value) : 55,
            blood_oxygen: latestSpo2,
            movement: this.calculateMovement(steps),
            breathing: this.estimateBreathingRate(latestHR?.value || 70),
            sleepStage: this.mapSleepStage(currentSleep?.levels?.data?.slice(-1)[0]?.level),
            timestamp: new Date().toISOString(),
            source: 'fitbit'
        };
    }

    /**
     * Transform Oura data to our format
     */
    transformOuraData(sleepData, readinessData) {
        const latest = sleepData.data?.[0];
        const readiness = readinessData.data?.[0];

        return {
            hrv: readiness?.contributors?.hrv_balance || 55,
            blood_oxygen: latest?.average_breath || 96,
            movement: latest?.efficiency ? (100 - latest.efficiency) / 10 : 2,
            breathing: latest?.average_breath || 15,
            sleepStage: this.mapOuraSleepStage(latest?.type),
            timestamp: new Date().toISOString(),
            source: 'oura'
        };
    }

    /**
     * Calculate HRV from heart rate (simplified)
     */
    calculateHRV(heartRate) {
        // Simplified: Higher HR = lower HRV
        return Math.max(20, Math.min(100, 100 - heartRate * 0.5));
    }

    /**
     * Calculate movement from steps
     */
    calculateMovement(steps) {
        return Math.min(10, steps / 100);
    }

    /**
     * Estimate breathing rate from heart rate
     */
    estimateBreathingRate(heartRate) {
        // Typical breathing rate is 1/4 to 1/5 of heart rate
        return Math.round(heartRate / 4.5);
    }

    /**
     * Map Fitbit sleep stages
     */
    mapSleepStage(fitbitStage) {
        const mapping = {
            'wake': 'Awake',
            'light': 'Light',
            'deep': 'Deep',
            'rem': 'REM'
        };
        return mapping[fitbitStage] || 'Unknown';
    }

    /**
     * Map Oura sleep stages
     */
    mapOuraSleepStage(ouraType) {
        const mapping = {
            'awake': 'Awake',
            'light_sleep': 'Light',
            'deep_sleep': 'Deep',
            'rem_sleep': 'REM'
        };
        return mapping[ouraType] || 'Unknown';
    }

    /**
     * Transform Zepp Life data to our format
     */
    transformZeppData(hrData, sleepData, spo2Data, stressData) {
        const latestHR = hrData.data?.lastMeasurement || hrData.heartRate || 70;
        const latestSpo2 = spo2Data.data?.lastMeasurement || spo2Data.spo2 || 96;
        const currentSleep = sleepData.data?.[0];
        const stress = stressData.data?.lastMeasurement || 0;

        return {
            hrv: this.calculateHRV(latestHR),
            blood_oxygen: latestSpo2,
            movement: (stress / 100) * 10, // Convert stress to movement scale
            breathing: this.estimateBreathingRate(latestHR),
            sleepStage: this.mapSleepStage(currentSleep?.stage),
            timestamp: new Date().toISOString(),
            source: 'zepp'
        };
    }

    /**
     * Transform Mi Fitness data to our format
     */
    transformMiFitnessData(hrData, sleepData, spo2Data, stepsData) {
        const latestHR = hrData.data?.lastMeasurement || hrData.heartRate || 70;
        const latestSpo2 = spo2Data.data?.lastMeasurement || spo2Data.spo2 || 96;
        const steps = stepsData.data?.steps || stepsData.steps || 0;
        const currentSleep = sleepData.data?.[0];

        return {
            hrv: this.calculateHRV(latestHR),
            blood_oxygen: latestSpo2,
            movement: this.calculateMovement(steps),
            breathing: this.estimateBreathingRate(latestHR),
            sleepStage: this.mapSleepStage(currentSleep?.stage),
            timestamp: new Date().toISOString(),
            source: 'mifitness'
        };
    }

    /**
     * Fetch data from Garmin
     */
    async fetchGarminData(userId) {
        const connection = this.activeConnections.get(userId);
        if (!connection || connection.device !== 'garmin') {
            throw new Error('Garmin not connected');
        }

        try {
            // Mock data for Garmin (real implementation would use Garmin API)
            return {
                hrv: 58,
                blood_oxygen: 95,
                movement: 3,
                breathing: 16,
                sleepStage: 'Light',
                timestamp: new Date().toISOString(),
                source: 'garmin'
            };
        } catch (error) {
            console.error('Garmin data fetch error:', error.message);
            return null;
        }
    }

    /**
     * Start continuous polling for a user
     */
    startPolling(userId, ws, intervalSeconds = 5) {
        // Clear existing interval if any
        this.stopPolling(userId);

        const connection = this.activeConnections.get(userId);
        if (!connection) {
            throw new Error('No device connected');
        }

        const intervalId = setInterval(async () => {
            try {
                let data;
                if (connection.device === 'fitbit') {
                    data = await this.fetchFitbitData(userId);
                } else if (connection.device === 'oura') {
                    data = await this.fetchOuraData(userId);
                } else if (connection.device === 'garmin') {
                    data = await this.fetchGarminData(userId);
                } else if (connection.device === 'zepp') {
                    data = await this.fetchZeppData(userId);
                } else if (connection.device === 'mifitness') {
                    data = await this.fetchMiFitnessData(userId);
                }

                if (data && ws && ws.readyState === 1) { // WebSocket.OPEN
                    ws.send(JSON.stringify({
                        type: 'stream',
                        payload: data
                    }));
                }
            } catch (error) {
                console.error('Polling error:', error.message);
            }
        }, intervalSeconds * 1000);

        this.pollingIntervals.set(userId, intervalId);
        console.log(`Started polling for user ${userId} every ${intervalSeconds}s`);
    }

    /**
     * Stop polling for a user
     */
    stopPolling(userId) {
        const intervalId = this.pollingIntervals.get(userId);
        if (intervalId) {
            clearInterval(intervalId);
            this.pollingIntervals.delete(userId);
            console.log(`Stopped polling for user ${userId}`);
        }
    }

    /**
     * Disconnect device
     */
    disconnect(userId) {
        this.stopPolling(userId);
        this.activeConnections.delete(userId);
        console.log(`Device disconnected for user ${userId}`);
    }

    /**
     * Get connection status
     */
    getConnectionStatus(userId) {
        const connection = this.activeConnections.get(userId);
        if (!connection) {
            return { connected: false };
        }

        return {
            connected: true,
            device: connection.device,
            connectedAt: connection.connectedAt
        };
    }
}

// Singleton instance
const wearableService = new WearableService();

module.exports = wearableService;
