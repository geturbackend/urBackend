const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');
const { sendAuthOtpEmail } = require('../utils/emailService');
const Project = require('../models/Project');
const { decrypt } = require('../utils/encryption');

// Create the email queue specifically for fast OTPs
const authEmailQueue = new Queue('auth-email-queue', { connection });

// Initialize Worker with Rate Limiting
const worker = new Worker('auth-email-queue', async (job) => {
    const { email, otp, type, pname, projectId } = job.data;
    const redact = (e) => e.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length));
    const maskedEmail = redact(email);

    let byokKey = null;
    let byokFrom = null;

    try {
        if (projectId) {
            const project = await Project.findById(projectId).select('+resendApiKey.encrypted +resendApiKey.iv +resendApiKey.tag resendFromEmail').lean();
            if (project && project.resendApiKey) {
                const decrypted = decrypt(project.resendApiKey);
                if (typeof decrypted === 'string' && decrypted.trim().length > 0) {
                    byokKey = decrypted.trim();
                    byokFrom = project.resendFromEmail || null;
                }
            }
        }
    } catch (err) {
        console.error(`[Queue] Failed to load BYOK config for project ${projectId}:`, err);
        // Continue and fallback to global key if BYOK lookup fails
    }

    try {
        console.log(`[Queue] Processing ${type} email for: ${maskedEmail}`);
        await sendAuthOtpEmail(email, { otp, type, pname, byokKey, byokFrom });
    } catch (error) {
        console.error(`[Queue] Failed to send auth email to ${maskedEmail}:`, error);
        throw error;
    }
}, {
    connection,
    limiter: {
        max: 2,
        duration: 1000, 
    }
});

worker.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job.id} failed:`, err);
});

module.exports = { authEmailQueue };
