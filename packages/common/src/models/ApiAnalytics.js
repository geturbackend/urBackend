const mongoose = require('mongoose');

const apiAnalyticsSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseTimeMs: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// TTL index – configurable via environment variable (default: 365 days)
const ttlDays = parseInt(process.env.ANALYTICS_TTL_DAYS || '365', 10);
apiAnalyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: ttlDays * 24 * 60 * 60 });

module.exports = mongoose.model('ApiAnalytics', apiAnalyticsSchema);