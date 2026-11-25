const express = require('express');
const router = express.Router();
const verifyApiKey = require('../middlewares/verifyApiKey');
const { loginLimiter } = require('../middlewares/api_usage');
const {checkAuthEnabled} = require('@urbackend/common');
const { checkUsageLimits, checkAuthUsersLimit } = require('../middlewares/usageGate');
const { signup, login, me, publicProfile, verifyEmail, resendVerificationOtp, requestPasswordReset, resetPasswordUser, updateProfile, changePasswordUser, refreshToken, logout, startSocialAuth, handleSocialAuthCallback, exchangeSocialRefreshToken } = require('../controllers/userAuth.controller');


// SIGNUP ROUTE
router.post('/signup', verifyApiKey, checkAuthEnabled, checkUsageLimits, checkAuthUsersLimit, signup);

// LOGIN ROUTE
router.post('/login', loginLimiter, verifyApiKey, checkAuthEnabled, checkUsageLimits, login);
router.get('/social/:provider/start', verifyApiKey, checkAuthEnabled, checkUsageLimits, startSocialAuth);
router.get('/social/:provider/callback', checkUsageLimits, checkAuthUsersLimit, handleSocialAuthCallback);
router.post('/social/exchange', verifyApiKey, checkAuthEnabled, checkUsageLimits, exchangeSocialRefreshToken);

// GET CURRENT USER
router.get('/me', verifyApiKey, checkAuthEnabled, checkUsageLimits, me);
router.get('/public/:username', verifyApiKey, checkAuthEnabled, checkUsageLimits, publicProfile);

// EMAIL VERIFICATION
router.post('/verify-email', verifyApiKey, checkAuthEnabled, checkUsageLimits, verifyEmail);
router.post('/resend-verification-otp', verifyApiKey, checkAuthEnabled, checkUsageLimits, resendVerificationOtp);

// PASSWORD RESET
router.post('/request-password-reset', verifyApiKey, checkAuthEnabled, checkUsageLimits, requestPasswordReset);
router.post('/reset-password', verifyApiKey, checkAuthEnabled, checkUsageLimits, resetPasswordUser);

// PROFILE MANAGEMENT
router.put('/update-profile', verifyApiKey, checkAuthEnabled, checkUsageLimits, updateProfile);
router.put('/change-password', verifyApiKey, checkAuthEnabled, checkUsageLimits, changePasswordUser);
router.post('/refresh-token', verifyApiKey, checkAuthEnabled, checkUsageLimits, refreshToken);
router.post('/logout', verifyApiKey, checkAuthEnabled, checkUsageLimits, logout);

module.exports = router;
