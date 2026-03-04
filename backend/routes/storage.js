const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyApiKey = require('../middleware/verifyApiKey');
const requireSecretKey = require('../middleware/requireSecretKey');
const projectRateLimiter = require('../middleware/projectRateLimiter');
const { uploadFile, deleteFile, deleteAllFiles } = require("../controllers/storage.controller")

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

// POST REQ UPLOAD FILE
router.post('/upload', verifyApiKey, projectRateLimiter, requireSecretKey, upload.single('file'), uploadFile);

// DELETE REQ SINGLE FILE
router.delete('/file', verifyApiKey, projectRateLimiter, requireSecretKey, deleteFile);

// DELETE REQ ALL FILES
router.delete('/all', verifyApiKey, projectRateLimiter, requireSecretKey, deleteAllFiles);

module.exports = router;