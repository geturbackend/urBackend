const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Developer' },
    otp: { type: String, required: true },           // bcrypt hash (FIX 2)
    attempts: { type: Number, default: 0 },           // brute-force guard (FIX 4)
    createdAt: { type: Date, default: Date.now, expires: '10m' } // MongoDB TTL index
});

module.exports = mongoose.model('Otp', otpSchema);

