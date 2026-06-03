const { Queue, Worker } = require('bullmq');
const connection = require('../config/redis');
const Project = require('../models/Project');
const { decrypt } = require('../utils/encryption');
const { Resend } = require('resend');
const MailLog = require('../models/MailLog');

// Lua script: only decrement quota key if it exists (prevents phantom negative keys with no TTL)
const DECR_IF_EXISTS_SCRIPT = `if redis.call('EXISTS', KEYS[1]) == 1 then return redis.call('DECR', KEYS[1]) else return 0 end`;

// Create the email queue for public API
const publicEmailQueue = new Queue('public-email-queue', { connection });

let worker = null;
const resetPublicEmailWorker = async () => {
    if (!worker) return;
    try {
        if (typeof worker.removeAllListeners === 'function') {
            worker.removeAllListeners();
        }
        if (typeof worker.close === 'function') {
            await worker.close();
        }
    } catch (_) {
        // Best-effort cleanup for test/runtime shutdown paths.
    } finally {
        worker = null;
    }
};

const initPublicEmailWorker = () => {
    if (worker) return worker;

    // Initialize Worker with Rate Limiting (10 per second to respect Resend limits)
    worker = new Worker('public-email-queue', async (job) => {
        const { projectId, payload, usingByok, consumedQuotaKey, templateUsed } = job.data;

        let clientKey = process.env.RESEND_API_KEY_2 || process.env.RESEND_API_KEY;
        let fromAddress = process.env.EMAIL_FROM || "urBackend <urbackend@apps.bitbros.in>";

        try {
            if (projectId && usingByok) {
                const project = await Project.findById(projectId).select('+resendApiKey.encrypted +resendApiKey.iv +resendApiKey.tag resendFromEmail').lean();
                if (project && project.resendApiKey) {
                    const decrypted = decrypt(project.resendApiKey);
                    if (typeof decrypted === 'string' && decrypted.trim().length > 0) {
                        clientKey = decrypted.trim();
                        fromAddress = project.resendFromEmail && project.resendFromEmail.trim()
                            ? project.resendFromEmail.trim()
                            : "onboarding@resend.dev";
                    }
                }
            }
        } catch (err) {
            console.error(`[Queue] Failed to load BYOK config for project ${projectId}:`, err);
            // Fallback to global key
        }

        if (!clientKey) {
            throw new Error("Resend API key is not configured.");
        }

        const resend = new Resend(clientKey);

        const finalPayload = {
            ...payload,
            from: fromAddress
        };

        const redact = (e) => {
            const atIdx = e.indexOf('@');
            if (atIdx <= 0) return e;
            const local = e.slice(0, atIdx);
            const domain = e.slice(atIdx);
            if (local.length <= 2) return '*'.repeat(local.length) + domain;
            return local.slice(0, 2) + '*'.repeat(local.length - 2) + domain;
        };
        const toList = Array.isArray(finalPayload.to) ? finalPayload.to : [finalPayload.to];
        const maskedTo = toList.map(redact).join(', ');

        console.log(`[Queue] Processing public email to: ${maskedTo}`);

        const { data, error } = await resend.emails.send(finalPayload);

        if (error) {
            console.error(`[Queue] Failed to send public email to ${maskedTo}:`, error);
            throw new Error(error.message || "Failed to send email");
        }

        if (data && data.id && projectId) {
            try {
                await MailLog.create({
                    projectId,
                    resendEmailId: data.id,
                    to: toList,
                    subject: finalPayload.subject || '',
                    status: 'sent',
                    usingByok: !!usingByok,
                    templateUsed: templateUsed || null,
                    sentAt: new Date()
                });
            } catch (logErr) {
                console.error(`[Queue] Failed to create MailLog for emailId ${data.id}:`, logErr);
            }
        }

        return { data };
    }, {
        connection,
        limiter: {
            max: 10,
            duration: 1000, // 10 per second
        }
    });

    worker.on('completed', (job) => {
        console.log(`[Queue] Job ${job.id} (public email) completed successfully`);
    });

    worker.on('failed', async (job, err) => {
        if (process.env.NODE_ENV !== 'test') {
            console.error(`[Queue] Job ${job?.id} (public email) failed:`, err);
        }
        if (job && job.data && job.data.consumedQuotaKey) {
            const maxAttempts = job.opts?.attempts || 1;
            if (job.attemptsMade >= maxAttempts) {
                await connection.eval(DECR_IF_EXISTS_SCRIPT, 1, job.data.consumedQuotaKey).catch(() => {});
            }
        }
    });

    return worker;
};

module.exports = { publicEmailQueue, initPublicEmailWorker, resetPublicEmailWorker };
