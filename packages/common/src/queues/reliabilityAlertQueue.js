const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');

const QUEUE_NAME = 'reliability-alert-queue';

const reliabilityAlertQueue = new Queue(QUEUE_NAME, { connection });

/**
 * Schedule the reliability alert cron.
 * Runs every 5 minutes.
 */
async function scheduleReliabilityAlert() {
  const existing = await reliabilityAlertQueue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === 'reliability-check') {
      await reliabilityAlertQueue.removeRepeatableByKey(job.key);
    }
  }

  await reliabilityAlertQueue.add(
    'reliability-check',
    {},
    {
      repeat: { pattern: '*/5 * * * *' }, // Every 5 minutes
      removeOnComplete: true,
      removeOnFail: { count: 10 },
    },
  );
  console.log('[ReliabilityAlert] Cron scheduled (every 5 mins)');
}

/**
 * Run the reliability check.
 * Looks at the last 15 minutes of ApiAnalytics.
 * If a project has >=20 total requests and >=5% error rate (using >= 500 for true platform errors),
 * it writes a PlatformEvent 'reliability_spike'.
 */
async function runReliabilityCheck() {
  const { ApiAnalytics, Project, PlatformEvent } = require('../models');

  const now = new Date();
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // Aggregate API calls by project for the last 15 mins
  const agg = await ApiAnalytics.aggregate([
    { $match: { timestamp: { $gte: fifteenMinsAgo } } },
    {
      $group: {
        _id: '$projectId',
        totalRequests: { $sum: 1 },
        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 500] }, 1, 0] } },
      },
    },
  ]);

  if (agg.length === 0) return;

  const spikes = [];

  for (const row of agg) {
    // Threshold: at least 20 requests in 15 mins to care about a % spike
    if (row.totalRequests >= 20) {
      const errorRate = row.errors / row.totalRequests;
      if (errorRate >= 0.05) {
        spikes.push({
          projectId: row._id,
          totalRequests: row.totalRequests,
          errors: row.errors,
          errorRate: Math.round(errorRate * 100),
        });
      }
    }
  }

  if (spikes.length === 0) return;

  // Resolve project owners
  const projectIds = spikes.map((s) => s.projectId).filter(Boolean);
  const projects = await Project.find({ _id: { $in: projectIds } })
    .select('owner')
    .lean();

  const ownerMap = {};
  for (const p of projects) {
    ownerMap[p._id.toString()] = p.owner;
  }

  // Create PlatformEvents
  const eventsToInsert = [];
  for (const spike of spikes) {
    const ownerId = ownerMap[spike.projectId.toString()];
    if (!ownerId) continue;

    eventsToInsert.push({
      developerId: ownerId,
      projectId: spike.projectId,
      event: 'reliability_spike',
      properties: {
        window: '15m',
        totalRequests: spike.totalRequests,
        errors: spike.errors,
        errorRatePct: spike.errorRate,
      },
      timestamp: now,
    });
  }

  if (eventsToInsert.length > 0) {
    await PlatformEvent.insertMany(eventsToInsert);
    console.log(`[ReliabilityAlert] Detected ${eventsToInsert.length} spikes, recorded PlatformEvents.`);
  }
}

/**
 * Initialize the worker.
 */
function initReliabilityAlertWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      await runReliabilityCheck();
    },
    { connection, concurrency: 1 },
  );

  worker.on('failed', (job, err) =>
    console.error('[ReliabilityAlert] Job failed:', err.message),
  );

  console.log('[ReliabilityAlert] Worker initialized');
  return worker;
}

module.exports = {
  reliabilityAlertQueue,
  scheduleReliabilityAlert,
  initReliabilityAlertWorker,
  runReliabilityCheck,
};
