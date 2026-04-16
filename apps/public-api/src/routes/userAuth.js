const express = require('express');
const router = express.Router();
const verifyApiKey = require('../middlewares/verifyApiKey');
const {checkAuthEnabled} = require('@urbackend/common');
const { signup, login, me, publicProfile, verifyEmail, resendVerificationOtp, requestPasswordReset, resetPasswordUser, updateProfile, changePasswordUser, refreshToken, logout, startSocialAuth, handleSocialAuthCallback, exchangeSocialRefreshToken } = require('../controllers/userAuth.controller');


// SIGNUP ROUTE
router.post('/signup', verifyApiKey, checkAuthEnabled, signup);

// LOGIN ROUTE
router.post('/login', verifyApiKey, checkAuthEnabled, login);
router.get('/social/:provider/start', verifyApiKey, checkAuthEnabled, startSocialAuth);
router.get('/social/:provider/callback', handleSocialAuthCallback);
router.post('/social/exchange', verifyApiKey, checkAuthEnabled, exchangeSocialRefreshToken);

// GET CURRENT USER
router.get('/me', verifyApiKey, checkAuthEnabled, me);
router.get('/public/:username', verifyApiKey, checkAuthEnabled, publicProfile);

// EMAIL VERIFICATION
router.post('/verify-email', verifyApiKey, checkAuthEnabled, verifyEmail);
router.post('/resend-verification-otp', verifyApiKey, checkAuthEnabled, resendVerificationOtp);

// PASSWORD RESET
router.post('/request-password-reset', verifyApiKey, checkAuthEnabled, requestPasswordReset);
router.post('/reset-password', verifyApiKey, checkAuthEnabled, resetPasswordUser);

// PROFILE MANAGEMENT
router.put('/update-profile', verifyApiKey, checkAuthEnabled, updateProfile);
router.put('/change-password', verifyApiKey, checkAuthEnabled, changePasswordUser);
router.post('/refresh-token', verifyApiKey, checkAuthEnabled, refreshToken);
router.post('/logout', verifyApiKey, checkAuthEnabled, logout);

module.exports = router;
