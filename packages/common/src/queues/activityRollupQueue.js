const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');

const QUEUE_NAME = 'activity-rollup-queue';

const activityRollupQueue = new Queue(QUEUE_NAME, { connection });

/**
 * Schedule the daily rollup cron if not already scheduled.
 * Runs at 00:05 UTC every day.
 *
 * Call once during app startup (after DB connect).
 */
async function scheduleActivityRollup() {
  // Remove any stale repeatable job first to avoid duplicate schedules
  const existing = await activityRollupQueue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === 'daily-rollup') {
      await activityRollupQueue.removeRepeatableByKey(job.key);
    }
  }

  await activityRollupQueue.add(
    'daily-rollup',
    {},
    {
      repeat: { pattern: '5 0 * * *' }, // 00:05 UTC daily
      removeOnComplete: true,
      removeOnFail: { count: 10 },
    },
  );
  console.log('[ActivityRollup] Daily cron scheduled (00:05 UTC)');
}

/**
 * Compute midnight UTC for "yesterday"
 */
function getYesterdayMidnightUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

/**
 * Run the rollup for a given day (defaults to yesterday UTC).
 *
 * Algorithm:
 *  1. Derive the ApiAnalytics collection (all projects)
 *  2. Group logs by projectId → count API calls, mail, storage, webhooks
 *  3. Resolve project owner for each projectId
 *  4. Upsert one DeveloperActivity per developer per day
 */
async function runRollup(targetDate) {
  const { ApiAnalytics, Project, DeveloperActivity } = require('../models');

  const dayStart = targetDate || getYesterdayMidnightUtc();
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  console.log(`[ActivityRollup] Running for ${dayStart.toISOString()}`);

  // 1. Aggregate logs by project for the day
  const logAgg = await ApiAnalytics.aggregate([
    { $match: { timestamp: { $gte: dayStart, $lt: dayEnd } } },
    {
      $group: {
        _id: '$projectId',
        apiCallCount: { $sum: 1 },
        mailCount: {
          $sum: { $cond: [{ $regexMatch: { input: '$endpoint', regex: /\/api\/mail/ } }, 1, 0] },
        },
        storageCount: {
          $sum: { $cond: [{ $regexMatch: { input: '$endpoint', regex: /\/api\/storage/ } }, 1, 0] },
        },
        webhookCount: {
          $sum: { $cond: [{ $regexMatch: { input: '$endpoint', regex: /\/api\/webhooks?/ } }, 1, 0] },
        },
      },
    },
  ]);

  if (logAgg.length === 0) {
    console.log('[ActivityRollup] No activity for this day.');
    return;
  }

  // 2. Batch-resolve project owners
  const projectIds = logAgg.map((r) => r._id).filter(Boolean);
  const projects = await Project.find({ _id: { $in: projectIds } })
    .select('owner')
    .lean();

  const ownerMap = {};
  for (const p of projects) {
    ownerMap[p._id.toString()] = p.owner;
  }

  // 3. Group by developer
  const devMap = {};
  for (const row of logAgg) {
    if (!row._id) continue;
    const ownerId = ownerMap[row._id.toString()];
    if (!ownerId) continue;
    const key = ownerId.toString();
    if (!devMap[key]) {
      devMap[key] = {
        developerId: ownerId,
        activeProjectIds: [],
        apiCallCount: 0,
        mailSentCount: 0,
        storageUploadsCount: 0,
        webhookTriggeredCount: 0,
      };
    }
    devMap[key].activeProjectIds.push(row._id);
    devMap[key].apiCallCount += row.apiCallCount;
    devMap[key].mailSentCount += row.mailCount;
    devMap[key].storageUploadsCount += row.storageCount;
    devMap[key].webhookTriggeredCount += row.webhookCount;
  }

  // 4. Upsert one record per developer
  const ops = Object.values(devMap).map((d) => ({
    updateOne: {
      filter: { developerId: d.developerId, date: dayStart },
      update: { $set: d },
      upsert: true,
    },
  }));

  if (ops.length > 0) {
    await DeveloperActivity.bulkWrite(ops);
    console.log(`[ActivityRollup] Upserted ${ops.length} developer activity records.`);
  }
}

/**
 * Initialize the BullMQ worker that processes rollup jobs.
 * Call once during app startup.
 */
function initActivityRollupWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      await runRollup();
    },
    { connection, concurrency: 1 },
  );

  worker.on('completed', () => console.log('[ActivityRollup] Rollup job completed'));
  worker.on('failed', (job, err) =>
    console.error('[ActivityRollup] Rollup job failed:', err.message),
  );

  console.log('[ActivityRollup] Worker initialized');
  return worker;
}

module.exports = {
  activityRollupQueue,
  scheduleActivityRollup,
  initActivityRollupWorker,
  runRollup, // exported for manual / test runs
};
