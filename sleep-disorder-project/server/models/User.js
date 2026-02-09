const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: Number,
    gender: String,
    name: { type: String },
    photo: { type: String },
    wearableTokens: {
        fitbit: {
            accessToken: String,
            refreshToken: String,
            expiresAt: Date,
            scope: String,
            userId: String,
            updatedAt: Date
        },
        oura: {
            accessToken: String,
            refreshToken: String,
            expiresAt: Date,
            scope: String,
            userId: String,
            updatedAt: Date
        },
        garmin: {
            accessToken: String,
            refreshToken: String,
            expiresAt: Date,
            scope: String,
            userId: String,
            updatedAt: Date
        },
        zepp: {
            accessToken: String,
            refreshToken: String,
            expiresAt: Date,
            scope: String,
            userId: String,
            updatedAt: Date
        },
        mifitness: {
            accessToken: String,
            refreshToken: String,
            expiresAt: Date,
            scope: String,
            userId: String,
            updatedAt: Date
        }
    }
});

module.exports = mongoose.model('User', userSchema);