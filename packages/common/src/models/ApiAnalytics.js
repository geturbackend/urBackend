const mongoose = require('mongoose');

const apiAnalyticsSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseTimeMs: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }, // TTL index will be applied below
  },
  { timestamps: false }
);

const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '365', 10);
if (!isNaN(ttlDays) && ttlDays > 0) {
  apiAnalyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: ttlDays * 24 * 60 * 60 });
} else {
  console.warn('Invalid ANALYTICS_TTL_DAYS, defaulting to 365 days');
  apiAnalyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
}

module.exports = mongoose.model('ApiAnalytics', apiAnalyticsSchema);