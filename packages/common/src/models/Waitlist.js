const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'claimed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);
