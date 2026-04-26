const mongoose = require('mongoose');

const proRequestSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
    },
    bio: {
        type: String,
        required: true,
        trim: true,
        maxLength: 250
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('ProRequest', proRequestSchema);
