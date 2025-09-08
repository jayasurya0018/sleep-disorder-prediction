const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true },
    quality: { type: String, required: true }
});

module.exports = mongoose.model('History', historySchema, 'history'); // Explicit collection name