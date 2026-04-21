const mongoose = require("mongoose");

// Encryption schema ko reuse karne ke liye alag se define kiya
const resourceConfigSchema = new mongoose.Schema(
  {
    encrypted: { type: String, select: false },
    iv: { type: String, select: false },
    tag: { type: String, select: false },
  },
  { _id: false },
);

const fieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["String", "Number", "Boolean", "Date", "Object", "Array", "Ref"],
  },
  required: { type: Boolean, default: false },
  unique: { type: Boolean, default: false },
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
      enum: ["public-read", "private", "owner-write-only"],
      default: "public-read",
    },
    ownerField: { type: String, default: "userId" },
    requireAuthForWrite: { type: Boolean, default: true },
  },
});

/**
 * Schema for OAuth providers like GitHub and Google.
 * Sensitive data like clientSecret is stored in an encrypted format.
 */
const authProviderSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    clientId: { type: String, default: "" },
    clientSecret: { type: resourceConfigSchema, default: null },
    redirectUri: { type: String, default: "" },
  },
  { _id: false },
);

/**
 * Legacy/compatibility schema for mail templates stored on the project
 * document as an embedded fallback/migration path; templates are rendered
 * server-side. Keep select:false to avoid accidentally returning large
 * template payloads in standard project responses.
 */
const mailTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, default: "" },
    html: { type: String, default: "" },
    text: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
    },
    publishableKey: {
      type: String,
      required: true,
      unique: true,
    },
    secretKey: {
      type: String,
      required: true,
      unique: true,
    },
    jwtSecret: {
      type: String,
      required: true,
    },
    isAuthEnabled: { type: Boolean, default: false },
    siteUrl: { type: String, default: "" },
    /**
     * Managed OAuth providers for project user authentication.
     */
    authProviders: {
      github: { type: authProviderSchema, default: () => ({}) },
      google: { type: authProviderSchema, default: () => ({}) },
    },
    resendApiKey: { type: resourceConfigSchema, default: null },
    resendFromEmail: { type: String, default: "" },

    mailTemplates: {
      type: [mailTemplateSchema],
      default: [],
      select: false,
    },

    collections: [collectionSchema],

    allowedDomains: {
      type: [String],
      default: ["*"],
    },

    // STORAGE LIMITS (Files)
    storageUsed: { type: Number, default: 0 },
    storageLimit: { type: Number, default: 20 * 1024 * 1024 },

    // DATABASE LIMITS (JSON Docs)
    databaseUsed: { type: Number, default: 0 },
    databaseLimit: { type: Number, default: 20 * 1024 * 1024 },

    // Granular Resources Structure
    resources: {
      db: {
        isExternal: { type: Boolean, default: false },
        config: { type: resourceConfigSchema, default: null },
      },
      storage: {
        isExternal: { type: Boolean, default: false },
        config: { type: resourceConfigSchema, default: null },
      },
    },
  },
  { timestamps: true },
);

projectSchema.index({ owner: 1 });

module.exports = mongoose.model("Project", projectSchema);
