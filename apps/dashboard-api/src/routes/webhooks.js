const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  createWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  getDeliveries,
  testWebhook,
} = require("../controllers/webhook.controller");
const { attachDeveloper, checkWebhookGate } = require("../middlewares/planEnforcement");
const authorizeProject = require("../middlewares/authorizeProject");
const { verifyEmail } = require('@urbackend/common');
// Create webhook
router.post("/:projectId/webhooks", authMiddleware, verifyEmail, authorizeProject('admin'), attachDeveloper, checkWebhookGate, createWebhook);

// List all webhooks for a project
router.get("/:projectId/webhooks", authMiddleware, authorizeProject(), getWebhooks);

// Get single webhook
router.get("/:projectId/webhooks/:webhookId", authMiddleware, authorizeProject(), getWebhook);

// Update webhook
router.patch("/:projectId/webhooks/:webhookId", authMiddleware, verifyEmail, authorizeProject('admin'), attachDeveloper, checkWebhookGate, updateWebhook);

// Delete webhook
router.delete("/:projectId/webhooks/:webhookId", authMiddleware, verifyEmail, authorizeProject('admin'), attachDeveloper, checkWebhookGate, deleteWebhook);

// Get delivery history
router.get("/:projectId/webhooks/:webhookId/deliveries", authMiddleware, authorizeProject(), getDeliveries);

// Test webhook
router.post("/:projectId/webhooks/:webhookId/test", authMiddleware, verifyEmail, authorizeProject('admin'), attachDeveloper, checkWebhookGate, testWebhook);

module.exports = router;
