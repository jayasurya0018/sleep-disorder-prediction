const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: Number,
    gender: String,
    name: { type: String },
    photo: { type: String }
});

module.exports = mongoose.model('User', userSchema);