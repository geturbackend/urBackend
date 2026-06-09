const express = require('express');
const { getHealth, getRedisHealth } = require('../controllers/health.controller');

const router = express.Router();

router.get('/', getHealth);
router.get('/redis', getRedisHealth);

module.exports = router;
