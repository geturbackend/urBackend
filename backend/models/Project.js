const mongoose = require('mongoose');

// Encryption schema ko reuse karne ke liye alag se define kiya
const resourceConfigSchema = new mongoose.Schema({
    encrypted: { type: String, select: false },
    iv: { type: String, select: false },
    tag: { type: String, select: false }
}, { _id: false });

const fieldSchema = new mongoose.Schema({
    key: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['String', 'Number', 'Boolean', 'Date']
    },
    required: { type: Boolean, default: false }
});

const collectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    model: [fieldSchema]
});

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Developer'
    },
    publishableKey: {
        type: String,
        required: true,
        unique: true
    },
    secretKey: {
        type: String,
        required: true,
        unique: true
    },
    jwtSecret: {
        type: String,
        required: true
    },
    collections: [collectionSchema],

    allowedDomains: {
        type: [String],
        default: ['*']
    },

    // STORAGE LIMITS (Files)
    storageUsed: { type: Number, default: 0 },
    storageLimit: { type: Number, default: 20 * 1024 * 1024 }, // 20MB default

    // DATABASE LIMITS (JSON Docs)
    databaseUsed: { type: Number, default: 0 },
    databaseLimit: { type: Number, default: 20 * 1024 * 1024 }, // 20MB default

    // Granular Resources Structure
    resources: {
        db: {
            isExternal: { type: Boolean, default: false },
            config: { type: resourceConfigSchema, default: null }
        },
        storage: {
            isExternal: { type: Boolean, default: false },
            config: { type: resourceConfigSchema, default: null }
        }
    }
}, { timestamps: true });

projectSchema.index({ owner: 1 });


module.exports = mongoose.model('Project', projectSchema);