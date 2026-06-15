const express = require('express');
const router = express.Router();
const authorization = require('../middlewares/authMiddleware');
const { getMe, updateOnboarding } = require('../controllers/auth.controller');

router.get('/me', authorization, getMe);
router.patch('/onboarding', authorization, updateOnboarding);

module.exports = router;
