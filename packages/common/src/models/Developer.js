const mongoose = require('mongoose');

const developerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    maxProjects: {
        type: Number,
        default: 1
    },
    refreshToken: {
        type: String,
        default: null,
        select: false
    },
    githubId: {
        type: String,
        default: null,
        index: true
    },
    githubUsername: {
        type: String,
        default: null
    },
    avatarUrl: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Developer', developerSchema);
