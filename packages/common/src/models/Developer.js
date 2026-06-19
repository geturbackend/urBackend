const mongoose = require('mongoose');

const onboardingStepsSchema = new mongoose.Schema({
    projectCreated: {
        type: Boolean,
        default: false
    },
    collectionCreated: {
        type: Boolean,
        default: false
    },
    firstApiCall: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const onboardingSchema = new mongoose.Schema({
    completed: {
        type: Boolean,
        default: false
    },
    steps: {
        type: onboardingStepsSchema,
        default: () => ({})
    },
    currentStep: {
        type: String,
        enum: ['project', 'collection', 'api'],
        default: 'project'
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    collectionId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    activationAt: {
        type: Date,
        default: null
    }
}, { _id: false });

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
    },
    onboarding: {
        type: onboardingSchema,
        default: () => ({})
    }
}, { timestamps: true });

module.exports = mongoose.model('Developer', developerSchema);
