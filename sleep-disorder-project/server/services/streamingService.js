/**
 * Streaming Data Service
 * Handles real-time data processing, buffering, and anomaly detection
 */

const axios = require('axios');

// Circular buffer to store recent data points
class CircularBuffer {
    constructor(size = 100) {
        this.size = size;
        this.buffer = [];
        this.index = 0;
    }

    push(item) {
        if (this.buffer.length < this.size) {
            this.buffer.push(item);
        } else {
            this.buffer[this.index] = item;
        }
        this.index = (this.index + 1) % this.size;
    }

    getAll() {
        return [...this.buffer];
    }

    getLast(n) {
        const len = this.buffer.length;
        if (n >= len) return [...this.buffer];
        
        const start = (this.index - n + this.size) % this.size;
        if (start < this.index) {
            return this.buffer.slice(start, this.index);
        } else {
            return [...this.buffer.slice(start), ...this.buffer.slice(0, this.index)];
        }
    }

    clear() {
        this.buffer = [];
        this.index = 0;
    }
}

// User data buffers: userId -> CircularBuffer
const userBuffers = new Map();

/**
 * Get or create buffer for user
 */
function getUserBuffer(userId) {
    if (!userBuffers.has(userId)) {
        userBuffers.set(userId, new CircularBuffer(100));
    }
    return userBuffers.get(userId);
}

/**
 * Analyze real-time data with ML model
 */
async function analyzeRealTime(streamData) {
    const { userId, hrv, blood_oxygen, movement, breathing, sleepStage } = streamData;

    // Get user's data buffer
    const buffer = getUserBuffer(userId);
    buffer.push(streamData);

    // Get last 30 data points for sequence analysis
    const recentData = buffer.getLast(30);

    // Build sleep stages sequence
    const sleepStages = recentData.map(d => d.sleepStage || 0);
    
    // Pad if less than 30 points
    while (sleepStages.length < 30) {
        sleepStages.unshift(0);
    }

    try {
        // Call ML service for real-time prediction
        const mlResponse = await axios.post('http://localhost:5002/predict', {
            sleepStages: sleepStages.join(','),
            hrv: hrv,
            blood_oxygen: blood_oxygen,
            movement: movement,
            breathing: breathing
        }, {
            timeout: 1000 // 1 second timeout for real-time
        });

        return {
            prediction: mlResponse.data,
            confidence: mlResponse.data.confidence || 0,
            latency: mlResponse.headers['x-response-time'] || 'N/A'
        };

    } catch (error) {
        console.error('Real-time ML prediction error:', error.message);
        
        // Fallback to rule-based analysis
        return {
            prediction: performRuleBasedAnalysis(streamData),
            confidence: 0.7,
            fallback: true,
            error: error.message
        };
    }
}

/**
 * Rule-based analysis fallback
 */
function performRuleBasedAnalysis(data) {
    const { hrv, blood_oxygen, movement, breathing } = data;
    
    const issues = [];
    let severity = 'Normal';

    // SpO2 thresholds
    if (blood_oxygen < 90) {
        issues.push('Critical oxygen desaturation');
        severity = 'Severe';
    } else if (blood_oxygen < 94) {
        issues.push('Low blood oxygen');
        severity = severity === 'Severe' ? 'Severe' : 'Moderate';
    }

    // HRV thresholds
    if (hrv < 20) {
        issues.push('Very low HRV');
        severity = severity === 'Severe' ? 'Severe' : 'Moderate';
    } else if (hrv < 40) {
        issues.push('Low HRV');
        if (severity === 'Normal') severity = 'Mild';
    }

    // Breathing rate
    if (breathing < 8 || breathing > 20) {
        issues.push('Abnormal breathing rate');
        severity = severity === 'Severe' ? 'Severe' : 'Moderate';
    }

    // Excessive movement
    if (movement > 10) {
        issues.push('Excessive movement detected');
        if (severity === 'Normal') severity = 'Mild';
    }

    return {
        disorder: issues.length > 0 ? 'Potential Sleep Disorder' : 'Normal Sleep',
        severity: severity,
        issues: issues,
        recommendations: generateQuickRecommendations(issues)
    };
}

/**
 * Generate quick recommendations
 */
function generateQuickRecommendations(issues) {
    const recommendations = [];

    if (issues.some(i => i.includes('oxygen'))) {
        recommendations.push('Consider sleeping position adjustment');
        recommendations.push('Consult healthcare provider if persistent');
    }

    if (issues.some(i => i.includes('HRV'))) {
        recommendations.push('Practice relaxation techniques before bed');
        recommendations.push('Maintain consistent sleep schedule');
    }

    if (issues.some(i => i.includes('breathing'))) {
        recommendations.push('Ensure clear nasal passages');
        recommendations.push('Consider sleep apnea screening');
    }

    if (issues.some(i => i.includes('movement'))) {
        recommendations.push('Review sleep environment comfort');
        recommendations.push('Avoid caffeine before bed');
    }

    return recommendations;
}

/**
 * Detect anomalies in real-time data
 */
async function detectAnomalies(streamData) {
    const { userId, hrv, blood_oxygen, movement, breathing } = streamData;
    
    const anomalies = [];

    // Get historical data for baseline comparison
    const buffer = getUserBuffer(userId);
    const recentData = buffer.getAll();

    if (recentData.length < 10) {
        // Not enough data for anomaly detection
        return anomalies;
    }

    // Calculate statistics from recent data
    const stats = calculateStats(recentData);

    // Check for anomalies using z-score method
    const spo2ZScore = Math.abs((blood_oxygen - stats.spo2.mean) / stats.spo2.std);
    const hrvZScore = Math.abs((hrv - stats.hrv.mean) / stats.hrv.std);
    const movementZScore = Math.abs((movement - stats.movement.mean) / stats.movement.std);
    const breathingZScore = Math.abs((breathing - stats.breathing.mean) / stats.breathing.std);

    // Flag anomalies (z-score > 3 is significant)
    if (spo2ZScore > 3) {
        anomalies.push({
            type: 'blood_oxygen',
            severity: blood_oxygen < stats.spo2.mean ? 'high' : 'medium',
            message: `Blood oxygen (${blood_oxygen}%) is ${spo2ZScore.toFixed(1)}σ from your baseline`,
            value: blood_oxygen,
            baseline: stats.spo2.mean,
            zScore: spo2ZScore
        });
    }

    if (hrvZScore > 3) {
        anomalies.push({
            type: 'hrv',
            severity: 'medium',
            message: `HRV (${hrv}ms) is ${hrvZScore.toFixed(1)}σ from your baseline`,
            value: hrv,
            baseline: stats.hrv.mean,
            zScore: hrvZScore
        });
    }

    if (movementZScore > 3) {
        anomalies.push({
            type: 'movement',
            severity: 'low',
            message: `Movement (${movement}) is unusually high`,
            value: movement,
            baseline: stats.movement.mean,
            zScore: movementZScore
        });
    }

    if (breathingZScore > 3) {
        anomalies.push({
            type: 'breathing',
            severity: 'medium',
            message: `Breathing rate (${breathing} bpm) is ${breathingZScore.toFixed(1)}σ from your baseline`,
            value: breathing,
            baseline: stats.breathing.mean,
            zScore: breathingZScore
        });
    }

    // Critical thresholds (always alert regardless of baseline)
    if (blood_oxygen < 88) {
        anomalies.unshift({
            type: 'critical_spo2',
            severity: 'critical',
            message: `CRITICAL: Blood oxygen at ${blood_oxygen}% - seek immediate medical attention`,
            value: blood_oxygen,
            action: 'emergency'
        });
    }

    return anomalies;
}

/**
 * Calculate statistics from data array
 */
function calculateStats(dataArray) {
    const spo2Values = dataArray.map(d => d.blood_oxygen);
    const hrvValues = dataArray.map(d => d.hrv);
    const movementValues = dataArray.map(d => d.movement);
    const breathingValues = dataArray.map(d => d.breathing);

    return {
        spo2: {
            mean: mean(spo2Values),
            std: std(spo2Values),
            min: Math.min(...spo2Values),
            max: Math.max(...spo2Values)
        },
        hrv: {
            mean: mean(hrvValues),
            std: std(hrvValues),
            min: Math.min(...hrvValues),
            max: Math.max(...hrvValues)
        },
        movement: {
            mean: mean(movementValues),
            std: std(movementValues),
            min: Math.min(...movementValues),
            max: Math.max(...movementValues)
        },
        breathing: {
            mean: mean(breathingValues),
            std: std(breathingValues),
            min: Math.min(...breathingValues),
            max: Math.max(...breathingValues)
        }
    };
}

/**
 * Calculate mean
 */
function mean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function std(values) {
    const avg = mean(values);
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

/**
 * Clear user buffer
 */
function clearUserBuffer(userId) {
    if (userBuffers.has(userId)) {
        userBuffers.get(userId).clear();
    }
}

/**
 * Get user statistics
 */
function getUserStats(userId) {
    const buffer = getUserBuffer(userId);
    const data = buffer.getAll();
    
    if (data.length === 0) {
        return null;
    }

    return calculateStats(data);
}

/**
 * Get user data for export
 */
function getUserData(userId) {
    const buffer = getUserBuffer(userId);
    return buffer.getAll();
}

module.exports = {
    analyzeRealTime,
    detectAnomalies,
    clearUserBuffer,
    getUserStats,
    getUserBuffer,
    getUserData
};
