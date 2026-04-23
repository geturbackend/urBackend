const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyApiKey = require('../middlewares/verifyApiKey');
const requireSecretKey = require('../middlewares/requireSecretKey');
const { checkUsageLimits } = require('../middlewares/usageGate');
const projectRateLimiter = require('../middlewares/projectRateLimiter');
const { uploadFile, deleteFile, deleteAllFiles, requestUpload, confirmUpload } = require("../controllers/storage.controller");

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

// POST REQ UPLOAD FILE
router.post('/upload', verifyApiKey, requireSecretKey, checkUsageLimits, upload.single('file'), uploadFile);

// NEW: presigned URL flow (no multer)
router.post('/upload-request', verifyApiKey, projectRateLimiter, requireSecretKey, requestUpload);
router.post('/upload-confirm', verifyApiKey, projectRateLimiter, requireSecretKey, confirmUpload);

// DELETE REQ SINGLE FILE
router.delete('/file', verifyApiKey, requireSecretKey, checkUsageLimits, deleteFile);

// DELETE REQ ALL FILES
router.delete('/all', verifyApiKey, requireSecretKey, checkUsageLimits, deleteAllFiles);

module.exports = router;