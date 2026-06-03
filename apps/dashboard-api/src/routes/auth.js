const express = require('express');
const router = express.Router();
const authorization = require('../middlewares/authMiddleware');
const {
    register,
    login,
    changePassword,
    deleteAccount,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
    logout,
    refreshToken,
    getMe,
    startGithubAuth,
    handleGithubCallback
} = require('../controllers/auth.controller');


const { authLimiter } = require('../middlewares/auth_limiter');
const rateLimit = require('express-rate-limit');
const dashboardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: "Dashboard usage limit exceeded. Slow down!" },
    skip: (req) => process.env.NODE_ENV === 'development',
});


router.post('/register', authLimiter, register);

router.post('/login', authLimiter, login);

router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.get('/github/start', startGithubAuth);
router.get('/github/callback', handleGithubCallback);

router.use(dashboardLimiter);

router.put('/change-password', authorization, changePassword);

router.delete('/delete-account', authorization, deleteAccount);

router.post('/refresh-token', refreshToken);
router.post('/logout', authorization, logout);

router.get('/me', authorization, getMe);

router.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

module.exports = router;
