const mongoose = require("mongoose");
const {
  Webhook,
  WebhookDelivery,
  Project,
  AppError,
  ApiResponse,
  encrypt,
  decrypt,
  createWebhookSchema,
  updateWebhookSchema,
  generateSignature,
  getProjectAccessQuery,
} = require("@urbackend/common");
const crypto = require("crypto");

// Validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Create a new webhook for a project
 */
module.exports.createWebhook = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!isValidId(projectId)) {
      return next(new AppError(400, "Invalid project ID"));
    }

    // Verify project access (owner or member)
    const project = await Project.findOne({
      _id: projectId,
      ...getProjectAccessQuery(req.user._id),
    });
    if (!project) {
      return next(new AppError(404, "Project not found"));
    }

    // Validate input
    const validation = createWebhookSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new AppError(400, validation.error.issues?.[0]?.message || "Validation failed"));
    }

    const { name, url, secret, events, enabled } = validation.data;

    // Encrypt the secret
    const encryptedSecret = encrypt(secret);

    const webhook = await Webhook.create({
      projectId,
      name,
      url,
      secret: encryptedSecret,
      events: events || {},
      enabled: enabled !== false,
    });

    // Return without secret
    return new ApiResponse({
        _id: webhook._id,
        projectId: webhook.projectId,
        name: webhook.name,
        url: webhook.url,
        events: Object.fromEntries(webhook.events || new Map()),
        enabled: webhook.enabled,
        createdAt: webhook.createdAt,
    }, "Webhook created").send(res, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all webhooks for a project
 */
module.exports.getWebhooks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!isValidId(projectId)) {
      return next(new AppError(400, "Invalid project ID"));
    }

    // Verify project access (owner or member)
    const project = await Project.findOne({
      _id: projectId,
      ...getProjectAccessQuery(req.user._id),
    });
    if (!project) {
      return next(new AppError(404, "Project not found"));
    }

    const webhooks = await Webhook.find({ projectId }).lean();

    // Transform events Map to plain object and exclude secret
    const data = webhooks.map((wh) => ({
      _id: wh._id,
      projectId: wh.projectId,
      name: wh.name,
      url: wh.url,
      events: wh.events || {},
      enabled: wh.enabled,
      createdAt: wh.createdAt,
      updatedAt: wh.updatedAt,
    }));

    return new ApiResponse(data).send(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single webhook
 */
module.exports.getWebhook = async (req, res, next) => {
  try {
    const { projectId, webhookId } = req.params;

    if (!isValidId(projectId) || !isValidId(webhookId)) {
      return next(new AppError(400, "Invalid ID format"));
    }

    // Verify project access (owner or member)
    const project = await Project.findOne({
      _id: projectId,
      ...getProjectAccessQuery(req.user._id),
    });
    if (!project) {
      return next(new AppError(404, "Project not found"));
    }

    const webhook = await Webhook.findOne({
      _id: webhookId,
      projectId,
    }).lean();

    if (!webhook) {
      return next(new AppError(404, "Webhook not found"));
    }

    return new ApiResponse({
      _id: webhook._id,
      projectId: webhook.projectId,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events || {},
      enabled: webhook.enabled,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    }).send(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a webhook
 */
module.exports.updateWebhook = async (req, res, next) => {
  try {
    const { projectId, webhookId } = req.params;

    if (!isValidId(projectId) || !isValidId(webhookId)) {
      return next(new AppError(400, "Invalid ID format"));
    }

    // Verify project access (owner or member)
    const project = await Project.findOne({
      _id: projectId,
      ...getProjectAccessQuery(req.user._id),
    });
    if (!project) {
      return next(new AppError(404, "Project not found"));
    }

    // Validate input
    const validation = updateWebhookSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new AppError(400, validation.error.issues?.[0]?.message || "Validation failed"));
    }

    const { name, url, secret, events, enabled } = validation.data;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (events !== undefined) updateData.events = events;
    if (enabled !== undefined) updateData.enabled = enabled;

    // Re-encrypt if secret is being updated
    if (secret !== undefined) {
      updateData.secret = encrypt(secret);
    }

    const webhook = await Webhook.findOneAndUpdate(
      { _id: webhookId, projectId },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!webhook) {
      return next(new AppError(404, "Webhook not found"));
    }

    return new ApiResponse({
      _id: webhook._id,
      projectId: webhook.projectId,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events || {},
      enabled: webhook.enabled,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    }, "Webhook updated").send(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a webhook
 */
module.exports.deleteWebhook = async (req, res, next) => {
  try {
    const { projectId, webhookId } = req.params;

    if (!isValidId(projectId) || !isValidId(webhookId)) {
      return next(new AppError(400, "Invalid ID format"));
    }

    // Verify project access (owner or member)
    const project = await Project.findOne({
      _id: projectId,
      ...getProjectAccessQuery(req.user._id),
    });
    if (!project) {
      return next(new AppError(404, "Project not found"));
    }

    const webhook = await Webhook.findOneAndDelete({
      _id: webhookId,
      projectId,
    });

    if (!webhook) {
      return next(new AppError(404, "Webhook not found"));
    }

    // Optionally clean up delivery logs (or keep for audit)
    // await WebhookDelivery.deleteMany({ webhookId });

    return new ApiResponse({}, "Webhook deleted").send(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Get delivery history for a webhook
 */
module.exports.getDeliveries = async (req, res, next) => {
  try {
    const { projectId, webhookId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    if (!isValidId(projectId) || !isValidId(webhookId)) {
      return next(new AppError(400, "Invalid ID format"));
    }

    // Verify project access (owner or member)
    const project = await Project.findOne({
      _id: projectId,
      ...getProjectAccessQuery(req.user._id),
    });
    if (!project) {
      return next(new AppError(404, "Project not found"));
    }

    // Verify webhook belongs to project
    const webhook = await Webhook.findOne({ _id: webhookId, projectId });
    if (!webhook) {
      return next(new AppError(404, "Webhook not found"));
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [deliveries, total] = await Promise.all([
      WebhookDelivery.find({ webhookId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WebhookDelivery.countDocuments({ webhookId }),
    ]);

    return new ApiResponse({
      deliveries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    }).send(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Send a test webhook
 */
module.exports.testWebhook = async (req, res, next) => {
  try {
    const { projectId, webhookId } = req.params;

    if (!isValidId(projectId) || !isValidId(webhookId)) {
      return next(new AppError(400, "Invalid ID format"));
    }

    // Verify project access (owner or member)
    const project = await Project.findOne({
      _id: projectId,
      ...getProjectAccessQuery(req.user._id),
    });
    if (!project) {
      return next(new AppError(404, "Project not found"));
    }

    // Load webhook with secret
    const webhook = await Webhook.findOne({ _id: webhookId, projectId }).select(
      "+secret.encrypted +secret.iv +secret.tag"
    );

    if (!webhook) {
      return next(new AppError(404, "Webhook not found"));
    }

    // Decrypt secret
    let secret;
    try {
      secret = decrypt(webhook.secret);
      if (!secret) throw new Error("Decryption failed");
    } catch (err) {
      return next(new AppError(500, "Failed to decrypt webhook secret"));
    }

    // Create test payload
    const testPayload = {
      event: "test.ping",
      timestamp: new Date().toISOString(),
      projectId: projectId.toString(),
      collection: "test",
      action: "ping",
      documentId: "test-" + crypto.randomUUID(),
      data: {
        message: "This is a test webhook from urBackend",
        triggeredBy: "dashboard",
      },
    };

    const signature = generateSignature(testPayload, secret);
    const startTime = Date.now();

    let statusCode = null;
    let responseBody = null;
    let error = null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout for test

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-urBackend-Signature": signature,
          "X-urBackend-Event": "test.ping",
          "X-urBackend-Delivery-Id": "test-" + crypto.randomUUID(),
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });

      statusCode = response.status;

      try {
        responseBody = await response.text();
        if (responseBody.length > 1024) {
          responseBody = responseBody.substring(0, 1024) + "...";
        }
      } catch {
        responseBody = "[Could not read response body]";
      }
    } catch (err) {
      error = err.name === "AbortError" ? "Request timeout (10s)" : err.message;
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Date.now() - startTime;
    const success = statusCode >= 200 && statusCode < 300;

    return new ApiResponse({
      success,
      statusCode,
      responseBody,
      error,
      durationMs,
    }).send(res);
  } catch (err) {
    next(err);
  }
};
