const express = require("express");
const router = express.Router();
const verifyApiKey = require("../middlewares/verifyApiKey");
const requireSecretKey = require("../middlewares/requireSecretKey");
const projectRateLimiter = require("../middlewares/projectRateLimiter");
const { sendMail } = require("../controllers/mail.controller");

router.post("/send", verifyApiKey, projectRateLimiter, requireSecretKey, sendMail);

module.exports = router;
