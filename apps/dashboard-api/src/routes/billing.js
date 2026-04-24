const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter, publicLimiter } = require('../middlewares/auth_limiter');
const { createCheckout, handleWebhook } = require('../controllers/billing.controller');

// Create a Razorpay checkout session (authenticated)
router.post('/checkout', authLimiter, authMiddleware, createCheckout);

// Receive webhook events from Razorpay (public — validated by HMAC signature)
router.post('/webhook', publicLimiter, handleWebhook);

module.exports = router;
