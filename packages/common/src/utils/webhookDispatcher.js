const Webhook = require("../models/Webhook");
const { enqueueWebhookDelivery } = require("../queues/webhookQueue");
const redis = require("../config/redis");
const { getMonthKey, getEndOfMonthTtlSeconds, incrWithTtlAtomic } = require("./usageCounter");

const SENSITIVE_KEYS = new Set([
  'secret',
  'token',
  'apiKey',
  'accessToken',
  'refreshToken',
  'access_token',
  'refresh_token',
  'privateKey',
  'private_key'
]);

/**
 * Recursively redacts keys that match common sensitive patterns.
 * @param {any} data - The data to redact.
 * @returns {any} Redacted data.
 */
function redactSensitiveData(data) {
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }
  
  if (data !== null && typeof data === 'object') {
    const clean = {};
    for (const key of Object.keys(data)) {
      if (SENSITIVE_KEYS.has(key) || key.toLowerCase().includes('password')) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = redactSensitiveData(data[key]);
      }
    }
    return clean;
  }
  
  return data;
}

/**
 * Dispatch webhooks for a data operation
 * Fire-and-forget: does not block the API response
 *
 * @param {Object} options
 * @param {string} options.projectId - The project ID
 * @param {string} options.collection - The collection name
 * @param {string} options.action - The action: 'insert', 'update', 'delete', or 'recover'
 * @param {Object} options.document - The document data (after insert/update, or before delete)
 * @param {string} options.documentId - The document _id
 */
async function dispatchWebhooks({ projectId, collection, action, document, documentId, options = {} }) {
  try {
    // Find all enabled webhooks for this project
    const webhooks = await Webhook.find({
      projectId,
      enabled: true,
    });

    if (!webhooks.length) return;

    // Normalize 'recover' to 'update' for the outgoing payload to prevent breaking strict consumers.
    // We add a 'isRecovery' flag so advanced users can still differentiate.
    const isRecovery = action === 'recover';
    const effectiveAction = isRecovery ? 'update' : action;
    const event = `${collection}.${effectiveAction}`;
    const timestamp = new Date().toISOString();

    // Redact sensitive fields before payload construction
    const safeData = redactSensitiveData(document);

    for (const webhook of webhooks) {
      // Check if this webhook listens to this collection+action
      const collectionEvents = webhook.events?.get(collection);
      if (!collectionEvents) continue;

      // Check for subscription: 
      // If it's a recovery, it fires if the user is subscribed to 'recover' OR 'update'.
      // Otherwise, check the exact action.
      const isSubscribed = isRecovery 
        ? (collectionEvents['recover'] || collectionEvents['update'])
        : collectionEvents[action];

      if (!isSubscribed) {
        continue;
      }

      const payload = {
        event,
        timestamp,
        projectId: projectId.toString(),
        collection,
        action: effectiveAction,
        documentId: documentId?.toString() || document?._id?.toString(),
        data: safeData,
        isRecovery: isRecovery // Add hint for consumers
      };

      // Enqueue delivery (fire-and-forget)
      enqueueWebhookDelivery({
        webhookId: webhook._id,
        projectId,
        event,
        payload,
      })
        .then(() => {
          // Increment delivery count in Redis (unless bypassed by Dashboard/Admin actions)
          if (!options.bypassLimit) {
            const now = new Date();
            const monthKey = getMonthKey(now);
            const ttlSeconds = getEndOfMonthTtlSeconds(now);
            const key = `project:usage:webhook:enqueued:${projectId}:${monthKey}`;
            // This counter tracks deliveries successfully queued
            incrWithTtlAtomic(redis, key, ttlSeconds).catch(() => {});
          }
        })
        .catch((err) => {
          console.error(`[Webhook Dispatch] Failed to enqueue: ${err.message}`);
        });
    }
  } catch (err) {
    // Log but don't throw - webhooks should never block the main operation
    console.error(`[Webhook Dispatch] Error: ${err.message}`);
  }
}

module.exports = { dispatchWebhooks };
