const express = require("express");
const router = express.Router();
const verifyApiKey = require("../middlewares/verifyApiKey");
const requireSecretKey = require("../middlewares/requireSecretKey");
const { checkUsageLimits } = require("../middlewares/usageGate");
const { 
  sendMail,
  getMailLogs,
  getMailStatus,
  handleResendWebhook,
  sendBatchMail,
  createAudience,
  getAudiences,
  getAudienceById,
  deleteAudience,
  addContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  createBroadcast,
  sendBroadcast,
  getBroadcasts,
  getBroadcastById,
  deleteBroadcast
} = require("../controllers/mail.controller");

// Webhook receiver (No auth required)
router.post("/webhook", handleResendWebhook);

// Standard endpoints
router.post("/send", verifyApiKey, requireSecretKey, checkUsageLimits, sendMail);
router.post("/send-batch", verifyApiKey, requireSecretKey, checkUsageLimits, sendBatchMail);

router.get("/logs", verifyApiKey, requireSecretKey, getMailLogs);
router.get("/logs/:resendId", verifyApiKey, requireSecretKey, getMailStatus);

// Audiences (BYOK Gate enforced inside controller)
router.post("/audiences", verifyApiKey, requireSecretKey, createAudience);
router.get("/audiences", verifyApiKey, requireSecretKey, getAudiences);
router.get("/audiences/:id", verifyApiKey, requireSecretKey, getAudienceById);
router.delete("/audiences/:id", verifyApiKey, requireSecretKey, deleteAudience);

// Contacts
router.post("/audiences/:id/contacts", verifyApiKey, requireSecretKey, addContact);
router.get("/audiences/:id/contacts", verifyApiKey, requireSecretKey, getContacts);
router.get("/audiences/:id/contacts/:contactId", verifyApiKey, requireSecretKey, getContactById);
router.patch("/audiences/:id/contacts/:contactId", verifyApiKey, requireSecretKey, updateContact);
router.delete("/audiences/:id/contacts/:contactId", verifyApiKey, requireSecretKey, deleteContact);

// Broadcasts (BYOK + Pro Gate enforced inside controller)
router.post("/broadcasts", verifyApiKey, requireSecretKey, checkUsageLimits, createBroadcast);
router.post("/broadcasts/:id/send", verifyApiKey, requireSecretKey, checkUsageLimits, sendBroadcast);
router.get("/broadcasts", verifyApiKey, requireSecretKey, checkUsageLimits, getBroadcasts);
router.get("/broadcasts/:id", verifyApiKey, requireSecretKey, checkUsageLimits, getBroadcastById);
router.delete("/broadcasts/:id", verifyApiKey, requireSecretKey, checkUsageLimits, deleteBroadcast);

module.exports = router;
