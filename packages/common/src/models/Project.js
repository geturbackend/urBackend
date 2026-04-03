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
        enum: ['String', 'Number', 'Boolean', 'Date', 'Object', 'Array', 'Ref']
    },
    required: { type: Boolean, default: false },
    // For type: 'Ref' — target collection name within the same project
    ref: { type: String },
    // For type: 'Array' — describes each array item { type, fields? }
    items: { type: mongoose.Schema.Types.Mixed },
});
// For type: 'Object' — recursive sub-fields
fieldSchema.add({ fields: [fieldSchema] });

const collectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    model: [fieldSchema],
    rls: {
        enabled: { type: Boolean, default: false },
        mode: {
            type: String,
            enum: ['owner-write-only'],
            default: 'owner-write-only'
        },
        ownerField: { type: String, default: 'userId' },
        requireAuthForWrite: { type: Boolean, default: true }
    }
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
    isAuthEnabled: { type: Boolean, default: false },
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
    },

    // EMAIL NOTIFICATIONS
    notificationSettings: {
        type: new mongoose.Schema({
            email: {
                enabled: { type: Boolean, default: true },
                storage: {
                    type: { type: String, enum: ['percentage', 'absolute'], default: 'percentage' },
                    thresholds: { type: [Number], default: [80, 95] },
                    absoluteLimit: { type: Number, default: null }, // bytes — for BYOD
                },
                database: {
                    type: { type: String, enum: ['percentage', 'absolute'], default: 'percentage' },
                    thresholds: { type: [Number], default: [80, 95] },
                    absoluteLimit: { type: Number, default: null }, // bytes — for BYOD
                },
            },
        }, { _id: false }),
        default: () => ({
            email: {
                enabled: true,
                storage: { type: 'percentage', thresholds: [80, 95], absoluteLimit: null },
                database: { type: 'percentage', thresholds: [80, 95], absoluteLimit: null },
            },
        }),
    },

    // Tracks when each threshold was last alerted (7-day cooldown)
    lastLimitNotification: {
        type: new mongoose.Schema({
            storage: {
                threshold80: { type: Date, default: null },
                threshold95: { type: Date, default: null },
                custom: { type: Date, default: null },
            },
            database: {
                threshold80: { type: Date, default: null },
                threshold95: { type: Date, default: null },
                custom: { type: Date, default: null },
            },
        }, { _id: false }),
        default: () => ({
            storage: { threshold80: null, threshold95: null, custom: null },
            database: { threshold80: null, threshold95: null, custom: null },
        }),
    },

    // Cached external DB/storage stats to avoid excessive queries (1-hr TTL)
    cachedUsageStats: {
        type: new mongoose.Schema({
            database: {
                size: { type: Number, default: 0 },          // bytes
                lastCalculated: { type: Date, default: null },
            },
            storage: {
                size: { type: Number, default: 0 },          // bytes
                lastCalculated: { type: Date, default: null },
            },
        }, { _id: false }),
        default: () => ({
            database: { size: 0, lastCalculated: null },
            storage: { size: 0, lastCalculated: null },
        }),
    },

}, { timestamps: true });


projectSchema.index({ owner: 1 });


module.exports = mongoose.model('Project', projectSchema);
