'use strict';

const { emailQueue } = require('../queues/emailQueue');
const Project = require('../models/Project');

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Checks whether a notification should be sent (cooldown check).
 * @param {Date|null} lastSent
 * @returns {boolean}
 */
function shouldSendNotification(lastSent) {
    if (!lastSent) return true;
    return Date.now() - new Date(lastSent).getTime() >= COOLDOWN_MS;
}

/**
 * Formats bytes into a human-readable string (MB).
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
}

/**
 * Checks thresholds and dispatches a limit-warning email if conditions are met.
 *
 * @param {Object}  options
 * @param {Object}  options.project       - Full Mongoose Project document
 * @param {string}  options.resourceType  - 'storage' | 'database'
 * @param {number}  options.currentUsage  - Current usage in bytes
 * @param {string}  options.ownerEmail    - Email address of the project owner
 */
async function checkAndNotify({ project, resourceType, currentUsage, ownerEmail }) {
    try {
        // Guard: notifications disabled or owner email missing
        const emailSettings = project.notificationSettings?.email;
        if (!emailSettings?.enabled) return;
        if (!ownerEmail) return;

        const resourceSettings = emailSettings[resourceType];
        if (!resourceSettings) return;

        const isExternal = resourceType === 'storage'
            ? project.resources?.storage?.isExternal
            : project.resources?.db?.isExternal;

        let alertKey = null;      // key into lastLimitNotification.<resourceType>
        let percentage = null;
        let limitBytes = null;

        if (resourceSettings.type === 'absolute' && resourceSettings.absoluteLimit != null) {
            // BYOD absolute threshold (stored in bytes)
            if (currentUsage >= resourceSettings.absoluteLimit) {
                alertKey = 'custom';
            }
        } else {
            // Managed percentage-based thresholds
            limitBytes = resourceType === 'storage'
                ? (project.storageLimit || 0)
                : (project.databaseLimit || 0);

            if (limitBytes > 0) {
                percentage = (currentUsage / limitBytes) * 100;

                // Find the highest crossed threshold (e.g. [80, 95])
                const thresholds = (resourceSettings.thresholds || [80, 95]).slice().sort((a, b) => b - a);
                for (const thresh of thresholds) {
                    if (percentage >= thresh) {
                        alertKey = `threshold${thresh}`;
                        break;
                    }
                }
            }
        }

        if (!alertKey) return; // No threshold crossed

        // Cooldown check
        const lastSent = project.lastLimitNotification?.[resourceType]?.[alertKey];
        if (!shouldSendNotification(lastSent)) return;

        // Enqueue the email
        await emailQueue.add('limit-warning', {
            ownerEmail,
            projectName: project.name,
            resourceType,
            currentUsage: formatBytes(currentUsage),
            limit: limitBytes != null ? formatBytes(limitBytes) : formatBytes(resourceSettings.absoluteLimit),
            percentage: percentage != null ? Math.round(percentage) : null,
            isBYOD: !!isExternal,
        });

        // Persist cooldown timestamp
        const updatePath = `lastLimitNotification.${resourceType}.${alertKey}`;
        await Project.updateOne(
            { _id: project._id },
            { $set: { [updatePath]: new Date() } }
        );

        console.log(`[limitNotification] ✅ ${resourceType} alert dispatched for project "${project.name}" (key: ${alertKey})`);
    } catch (err) {
        // Never let notification logic crash the calling controller
        console.error('[limitNotification] Failed to dispatch notification:', err.message);
    }
}

module.exports = { checkAndNotify, shouldSendNotification };
