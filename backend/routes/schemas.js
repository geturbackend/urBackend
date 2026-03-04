const express = require('express');
const router = express.Router();
const verifyApiKey = require('../middleware/verifyApiKey');
const requireSecretKey = require('../middleware/requireSecretKey');
const projectRateLimiter = require('../middleware/projectRateLimiter');
const { checkSchema, createSchema } = require("../controllers/schema.controller");

// GET REQ FETCH SCHEMA
router.get('/:collectionName', verifyApiKey, projectRateLimiter, checkSchema);

// POST REQ CREATE SCHEMA
router.post('/', verifyApiKey, projectRateLimiter, requireSecretKey, createSchema);

module.exports = router;
