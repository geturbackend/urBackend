const mongoose = require('mongoose');

/**
 * DeveloperActivity — daily activity rollup per developer.
 *
 * Written by the `rollupActivity` BullMQ cron job (Phase 2),
 * not per-request. Used for D1/D7/D30 retention and engagement
 * feature-usage queries.
 */
const developerActivitySchema = new mongoose.Schema(
  {
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Developer',
      required: true,
    },
    // Midnight UTC for the day this record represents
    date: {
      type: Date,
      required: true,
    },
    // Projects that fired at least 1 API call that day
    activeProjectIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    apiCallCount: { type: Number, default: 0 },
    mailSentCount: { type: Number, default: 0 },
    storageUploadsCount: { type: Number, default: 0 },
    webhookTriggeredCount: { type: Number, default: 0 },
  },
  { timestamps: false },
);

// One record per developer per day
developerActivitySchema.index({ developerId: 1, date: -1 }, { unique: true });
developerActivitySchema.index({ date: -1 });

module.exports = mongoose.model('DeveloperActivity', developerActivitySchema);
