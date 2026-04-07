const { Queue, Worker } = require("bullmq");
const connection = require("../config/redis");
const crypto = require("crypto");
const WebhookDelivery = require("../models/WebhookDelivery");
const Webhook = require("../models/Webhook");
const { decrypt } = require("../utils/encryption");

// Exponential backoff delays in milliseconds: 1min, 5min, 15min, 1hr, 4hr
const RETRY_DELAYS = [
  60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  4 * 60 * 60 * 1000,
];
const MAX_ATTEMPTS = 5;

const webhookQueue = new Queue("webhook-delivery-queue", { connection });

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest("hex")}`;
}

/**
 * Truncate string to maxLength
 */
function truncate(str, maxLength = 1024) {
  if (!str || typeof str !== "string") return str;
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
}

/**
 * Create initial webhook delivery job
 */
async function enqueueWebhookDelivery({
  webhookId,
  projectId,
  event,
  payload,
}) {
  // Create delivery record
  const delivery = await WebhookDelivery.create({
    webhookId,
    projectId,
    event,
    payload,
    finalStatus: "pending",
    attempts: [],
  });

  // Add job to queue
  await webhookQueue.add(
    "deliver",
    {
      deliveryId: delivery._id.toString(),
      webhookId: webhookId.toString(),
      attemptNumber: 1,
    },
    {
      attempts: 1, // BullMQ handles single attempt; we manage retries ourselves
      removeOnComplete: true,
      removeOnFail: { count: 100 }, // Keep last 100 failed jobs for debugging
    }
  );

  return delivery;
}

/**
 * Initialize the webhook worker
 * Call this once during app startup
 */
function initWebhookWorker() {
  const worker = new Worker(
    "webhook-delivery-queue",
    async (job) => {
      const { deliveryId, webhookId, attemptNumber } = job.data;

      const delivery = await WebhookDelivery.findById(deliveryId);
      if (!delivery) {
        console.error(`[Webhook] Delivery ${deliveryId} not found`);
        return;
      }

      if (delivery.finalStatus !== "pending") {
        console.log(
          `[Webhook] Delivery ${deliveryId} already ${delivery.finalStatus}, skipping`
        );
        return;
      }

      // Load webhook with secret
      const webhook = await Webhook.findById(webhookId).select(
        "+secret.encrypted +secret.iv +secret.tag"
      );
      if (!webhook || !webhook.enabled) {
        console.log(`[Webhook] Webhook ${webhookId} disabled or not found`);
        await WebhookDelivery.findByIdAndUpdate(deliveryId, {
          finalStatus: "failed",
          $push: {
            attempts: {
              attemptNumber,
              status: "failed",
              error: "Webhook disabled or not found",
              attemptedAt: new Date(),
            },
          },
        });
        return;
      }

      // Decrypt secret
      let secret;
      try {
        secret = decrypt(webhook.secret);
        if (!secret) throw new Error("Decryption returned null");
      } catch (err) {
        console.error(`[Webhook] Failed to decrypt secret: ${err.message}`);
        await WebhookDelivery.findByIdAndUpdate(deliveryId, {
          finalStatus: "failed",
          $push: {
            attempts: {
              attemptNumber,
              status: "failed",
              error: "Secret decryption failed",
              attemptedAt: new Date(),
            },
          },
        });
        return;
      }

      // Prepare payload and signature
      const signature = generateSignature(delivery.payload, secret);
      const startTime = Date.now();

      let statusCode = null;
      let responseBody = null;
      let error = null;
      let success = false;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-urBackend-Signature": signature,
            "X-urBackend-Event": delivery.event,
            "X-urBackend-Delivery-Id": deliveryId,
          },
          body: JSON.stringify(delivery.payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        statusCode = response.status;

        try {
          responseBody = await response.text();
          responseBody = truncate(responseBody, 1024);
        } catch {
          responseBody = "[Could not read response body]";
        }

        success = statusCode >= 200 && statusCode < 300;
      } catch (err) {
        error = err.name === "AbortError" ? "Request timeout (30s)" : err.message;
      }

      const durationMs = Date.now() - startTime;

      // Update delivery with attempt result
      const attemptRecord = {
        attemptNumber,
        status: success ? "success" : "failed",
        statusCode,
        responseBody,
        error,
        attemptedAt: new Date(),
        durationMs,
      };

      // Determine if we should retry
      const is4xx = statusCode >= 400 && statusCode < 500;
      const shouldRetry = !success && !is4xx && attemptNumber <= MAX_ATTEMPTS;

      if (success) {
        await WebhookDelivery.findByIdAndUpdate(deliveryId, {
          finalStatus: "delivered",
          nextRetryAt: null,
          $push: { attempts: attemptRecord },
        });
        console.log(
          `[Webhook] Delivery ${deliveryId} succeeded on attempt ${attemptNumber}`
        );
      } else if (shouldRetry) {
        const nextDelay = RETRY_DELAYS[attemptNumber - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        const nextRetryAt = new Date(Date.now() + nextDelay);

        await WebhookDelivery.findByIdAndUpdate(deliveryId, {
          nextRetryAt,
          $push: { attempts: attemptRecord },
        });

        // Schedule retry job with delay
        await webhookQueue.add(
          "deliver",
          {
            deliveryId,
            webhookId,
            attemptNumber: attemptNumber + 1,
          },
          {
            delay: nextDelay,
            attempts: 1,
            removeOnComplete: true,
            removeOnFail: { count: 100 }, // Keep last 100 failed jobs for debugging
          }
        );

        console.log(
          `[Webhook] Delivery ${deliveryId} failed attempt ${attemptNumber}, retrying in ${nextDelay / 1000}s`
        );
      } else {
        // Final failure
        await WebhookDelivery.findByIdAndUpdate(deliveryId, {
          finalStatus: "failed",
          nextRetryAt: null,
          $push: { attempts: attemptRecord },
        });
        console.log(
          `[Webhook] Delivery ${deliveryId} permanently failed after ${attemptNumber} attempts` +
            (is4xx ? ` (4xx response: ${statusCode})` : "")
        );
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Webhook Worker] Job ${job.id} processed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Webhook Worker] Job ${job?.id} error:`, err.message);
  });

  console.log("[Webhook] Worker initialized");
  return worker;
}

module.exports = {
  webhookQueue,
  enqueueWebhookDelivery,
  initWebhookWorker,
  generateSignature,
};
