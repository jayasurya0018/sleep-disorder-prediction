// Script to clean invalid sleep data from MongoDB for the sleep disorder project
// Usage: node clean_sleepdata.js (run in server directory with MongoDB running)

const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sleepdb';

const validSleepStages = ["Awake", "REM", "Light", "Deep"];

const sleepDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sleepStages: [String],
    hrv: Number,
    spo2: Number,
    movement: Number,
    breathing: Number,
    timestamp: { type: Date, default: Date.now }
});
const SleepData = mongoose.model('SleepData', sleepDataSchema, 'sleepdatas');

async function cleanSleepData() {
    await mongoose.connect(MONGO_URI);
    const all = await SleepData.find({});
    let removed = 0;
    let fixed = 0;
    for (const entry of all) {
        let stages = [];
        if (Array.isArray(entry.sleepStages)) {
            stages = entry.sleepStages;
        } else if (typeof entry.sleepStages === 'string') {
            stages = entry.sleepStages.split(',');
        }
        // Check for at least one valid stage
        const hasValidStage = stages.some(s => validSleepStages.includes(s));
        // Check all numeric fields
        const validNumbers = [entry.hrv, entry.spo2, entry.movement, entry.breathing].every(
            v => typeof v === 'number' && !isNaN(v)
        );
        if (!hasValidStage || !validNumbers) {
            await SleepData.deleteOne({ _id: entry._id });
            removed++;
            continue;
        }
        // Fix: convert sleepStages to array of valid names only
        const filteredStages = stages.filter(s => validSleepStages.includes(s));
        if (filteredStages.length !== stages.length) {
            entry.sleepStages = filteredStages;
            await entry.save();
            fixed++;
        }
    }
    console.log(`Removed ${removed} invalid entries. Fixed ${fixed} entries.`);
    await mongoose.disconnect();
}

cleanSleepData().catch(err => {
    console.error('Error cleaning sleep data:', err);
    process.exit(1);
});
