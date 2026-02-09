/**
 * Daily Summary Email Job
 * Sends daily sleep summary emails to users who have it enabled
 * Runs at 8:00 AM every day (user's timezone)
 */

const cron = require('node-cron');
const User = require('../models/User');
const SleepData = require('../models/SleepData');
const emailService = require('../services/emailService');

let scheduledJob = null;

/**
 * Start the daily summary email job
 */
const startDailySummaryJob = () => {
    // Schedule: 0 8 * * * = 8:00 AM every day
    scheduledJob = cron.schedule('0 8 * * *', async () => {
        console.log('🔔 [Daily Summary Job] Starting at', new Date().toISOString());

        try {
            // Find all users with daily summary enabled
            const users = await User.find({
                'preferences.dailySummary': true
            }).select('_id email firstName preferences');

            console.log(`📊 Found ${users.length} users with daily summaries enabled`);

            if (users.length === 0) {
                console.log('⏭️  No users with daily summaries enabled - skipping');
                return;
            }

            for (const user of users) {
                try {
                    // Calculate yesterday's stats
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    yesterday.setHours(0, 0, 0, 0);

                    const tomorrow = new Date(yesterday);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const records = await SleepData.find({
                        userId: user._id,
                        timestamp: {
                            $gte: yesterday,
                            $lt: tomorrow
                        }
                    });

                    if (records.length === 0) {
                        console.log(`⏭️  No data for user ${user.email} - skipping`);
                        continue;
                    }

                    // Calculate averages
                    const avgHRV = records.reduce((sum, r) => sum + (r.hrv || 0), 0) / records.length;
                    const avgSpO2 = records.reduce((sum, r) => sum + (r.blood_oxygen || 0), 0) / records.length;
                    const avgBreathing = records.reduce((sum, r) => sum + (r.breathing || 0), 0) / records.length;
                    const alertCount = records.filter(r => r.alert).length;

                    // Get sleep stage distribution
                    const stages = {};
                    records.forEach(r => {
                        const stage = r.sleepStage || 'Unknown';
                        stages[stage] = (stages[stage] || 0) + 1;
                    });

                    // Create summary data
                    const summaryData = {
                        date: yesterday.toLocaleDateString(),
                        totalRecords: records.length,
                        avgHRV: isFinite(avgHRV) ? avgHRV : 0,
                        avgSpO2: isFinite(avgSpO2) ? avgSpO2 : 0,
                        avgBreathing: isFinite(avgBreathing) ? avgBreathing : 0,
                        alertCount,
                        sleepStages: stages
                    };

                    // Send summary email
                    const result = await emailService.sendDailySummary(user.email, summaryData);

                    if (result.success) {
                        console.log(`✅ Daily summary sent to ${user.email}`);

                        // Update user's last summary sent timestamp
                        user.emailStats = user.emailStats || {};
                        user.emailStats.lastSummaryEmail = new Date();
                        await user.save();
                    } else {
                        console.error(`❌ Failed to send summary to ${user.email}: ${result.error || result.reason}`);
                    }

                } catch (error) {
                    console.error(`❌ Error processing user ${user.email}:`, error.message);
                }
            }

            console.log('✅ Daily summary job completed');

        } catch (error) {
            console.error('❌ Daily summary job error:', error.message);
        }
    });

    console.log('✅ Daily summary job scheduled for 8:00 AM every day');
};

/**
 * Stop the daily summary job
 */
const stopDailySummaryJob = () => {
    if (scheduledJob) {
        scheduledJob.stop();
        console.log('⏹️  Daily summary job stopped');
    }
};

/**
 * Manually trigger the job (for testing)
 */
const triggerDailySummaryNow = async () => {
    console.log('🔔 Manually triggering daily summary job...');
    
    try {
        const users = await User.find({
            'preferences.dailySummary': true
        }).select('_id email firstName preferences');

        console.log(`📊 Found ${users.length} users with daily summaries enabled`);

        for (const user of users) {
            try {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                yesterday.setHours(0, 0, 0, 0);

                const tomorrow = new Date(yesterday);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const records = await SleepData.find({
                    userId: user._id,
                    timestamp: { $gte: yesterday, $lt: tomorrow }
                });

                if (records.length === 0) {
                    console.log(`⏭️  No data for user ${user.email}`);
                    continue;
                }

                const avgHRV = records.reduce((sum, r) => sum + (r.hrv || 0), 0) / records.length;
                const avgSpO2 = records.reduce((sum, r) => sum + (r.blood_oxygen || 0), 0) / records.length;
                const avgBreathing = records.reduce((sum, r) => sum + (r.breathing || 0), 0) / records.length;
                const alertCount = records.filter(r => r.alert).length;

                const stages = {};
                records.forEach(r => {
                    const stage = r.sleepStage || 'Unknown';
                    stages[stage] = (stages[stage] || 0) + 1;
                });

                const summaryData = {
                    date: yesterday.toLocaleDateString(),
                    totalRecords: records.length,
                    avgHRV: isFinite(avgHRV) ? avgHRV : 0,
                    avgSpO2: isFinite(avgSpO2) ? avgSpO2 : 0,
                    avgBreathing: isFinite(avgBreathing) ? avgBreathing : 0,
                    alertCount,
                    sleepStages: stages
                };

                const result = await emailService.sendDailySummary(user.email, summaryData);

                if (result.success) {
                    console.log(`✅ Summary sent to ${user.email}`);
                } else {
                    console.error(`❌ Failed to send to ${user.email}:`, result.error);
                }
            } catch (error) {
                console.error(`❌ Error for ${user.email}:`, error.message);
            }
        }

        console.log('✅ Manual trigger completed');
        return { success: true, message: 'Daily summaries sent' };

    } catch (error) {
        console.error('❌ Manual trigger error:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    startDailySummaryJob,
    stopDailySummaryJob,
    triggerDailySummaryNow
};
