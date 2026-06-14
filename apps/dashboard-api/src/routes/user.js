const express = require('express');
const router = express.Router();
const authorization = require('../middlewares/authMiddleware');
const { getMe } = require('../controllers/auth.controller');

router.get('/me', authorization, getMe);

module.exports = router;
