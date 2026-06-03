const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');
const { sendReleaseEmail, sendExportReadyEmail } = require('../utils/emailService');

// Create the email queue
const emailQueue = new Queue('email-queue', { connection });

// Initialize Worker with Rate Limiting
const worker = new Worker('email-queue', async (job) => {

        if (job.name === 'release-email') {
            const { email, version, title, content, changelogUrl } = job.data;
            try {
                console.log(`[Queue] Processing Release email for: ${email}`);
                await sendReleaseEmail(email, { version, title, content, changelogUrl });
            } catch (error) {
                console.error(`[Queue] Failed to send email to ${email}:`, error);
                throw error;
            }
        }

        else if (job.name === 'send-export-email') {
            const { email, downloadUrl, projectName } = job.data;

            try {
                console.log(`[EmailWorker] Sending simple export email to ${email} for ${projectName}`);
                await sendExportReadyEmail({ to: email, downloadUrl, projectName });
                console.log(`[EmailWorker] Export email successfully sent to ${email}`);
            } catch (error) {
                console.error(`[EmailWorker] Failed to send export email to ${email}:`, error);
                throw error;
            }
        } 
        
        else {
            throw new Error(`[emailQueue] Unknown job type: ${job.name}`);
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
