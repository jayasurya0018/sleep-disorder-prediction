const mongoose = require('mongoose');

const sleepDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sleepStages: [String],
    hrv: Number,
    spo2: Number,
    movement: Number,
    breathing: Number,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SleepData', sleepDataSchema);