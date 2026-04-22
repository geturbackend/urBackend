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
    maxCollections: {
        type: Number,
        default: 20
    },
    plan: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free'
    },
    planActivatedAt: {
        type: Date,
        default: null
    },
    planExpiresAt: {
        type: Date,
        default: null
    },
    trialUsed: {
        type: Boolean,
        default: false
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
