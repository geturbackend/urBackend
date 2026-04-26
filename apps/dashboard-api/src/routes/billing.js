const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter, publicLimiter } = require('../middlewares/auth_limiter');
const { 
    createCheckout, 
    handleWebhook, 
    createProRequest,
    getProRequests,
    approveProRequest
} = require('../controllers/billing.controller');

// Create a Razorpay checkout session (authenticated)
router.post('/checkout', authLimiter, authMiddleware, createCheckout);

// Manual Pro request (public)
router.post('/request-pro', publicLimiter, createProRequest);

// --- Admin Routes ---
router.get('/admin/pro-requests', authLimiter, authMiddleware, getProRequests);
router.post('/admin/approve-pro', authLimiter, authMiddleware, approveProRequest);

// Receive webhook events from Razorpay (public — validated by HMAC signature)
router.post('/webhook', publicLimiter, handleWebhook);

module.exports = router;
