const express = require('express');
const router = express.Router();
const authorization = require('../middleware/authMiddleware');
const {
    register,
    login,
    changePassword,
    deleteAccount,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword
} = require('../controllers/auth.controller');


// REGISTER ROUTE
router.post('/register', register);

// LOGIN ROUTE
router.post('/login', login);

// CHANGE PASSWORD (Protected)
router.put('/change-password', authorization, changePassword);

// DELETE ACCOUNT (Protected - Danger Zone)
router.delete('/delete-account', authorization, deleteAccount);

// OTP (email verification)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// PASSWORD RESET (FIX 5)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
