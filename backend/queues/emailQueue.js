const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { sendReleaseEmail } = require('../utils/emailService');

const connection = new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
});

// Create the email queue
const emailQueue = new Queue('email-queue', { connection });

// Initialize Worker with Rate Limiting
const worker = new Worker('email-queue', async (job) => {
    const { email, version, title, content } = job.data;
    try {
        console.log(`[Queue] Processing Release email for: ${email}`);
        await sendReleaseEmail(email, { version, title, content });
    } catch (error) {
        console.error(`[Queue] Failed to send email to ${email}:`, error);
        throw error;
    }
}, {
    connection,
    limiter: {
        max: 1,
        duration: 900000, // 1 job per 15 minutes (96 per 24 hours) - safe for 100 limit
    }
});

worker.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job.id} failed:`, err);
});

module.exports = { emailQueue };
