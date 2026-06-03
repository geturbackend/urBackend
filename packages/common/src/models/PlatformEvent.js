const mongoose = require('mongoose');

/**
 * PlatformEvent — single-collection store for all activation/funnel/AI events.
 *
 * Events emitted:
 *   signup_completed        — after Developer is saved on /api/auth/register
 *   email_verified          — after OTP verified and isVerified set to true
 *   project_created         — after Project.save() in createProject
 *   collection_created      — after project.save() in createCollection
 *   first_api_success       — after first 2xx response logged for a project
 *   frontend_event          — any event emitted from the dashboard UI (onboarding steps, key copy, etc.)
 *   ai_generation_started   — Phase 4
 *   ai_generation_completed — Phase 4
 *   ai_schema_accepted      — Phase 4
 *   ai_schema_rejected      — Phase 4
 */
const platformEventSchema = new mongoose.Schema(
  {
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Developer',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    // e.g. 'signup_completed', 'first_api_success', 'ai_schema_accepted'
    event: {
      type: String,
      required: true,
      index: true,
    },
    // Free-form context — keep lean. No PII beyond developerId.
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

// Compound indexes for fast funnel queries
platformEventSchema.index({ developerId: 1, event: 1, timestamp: -1 });
platformEventSchema.index({ event: 1, timestamp: -1 });

// TTL: 2-year retention (730 days)
platformEventSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 730 * 24 * 60 * 60 },
);

module.exports = mongoose.model('PlatformEvent', platformEventSchema);
