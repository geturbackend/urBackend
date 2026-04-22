const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyApiKey = require('../middlewares/verifyApiKey');
const requireSecretKey = require('../middlewares/requireSecretKey');
const { checkUsageLimits } = require('../middlewares/usageGate');
const { uploadFile, deleteFile, deleteAllFiles } = require("../controllers/storage.controller")

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

// POST REQ UPLOAD FILE
router.post('/upload', verifyApiKey, checkUsageLimits, requireSecretKey, upload.single('file'), uploadFile);

// DELETE REQ SINGLE FILE
router.delete('/file', verifyApiKey, checkUsageLimits, requireSecretKey, deleteFile);

// DELETE REQ ALL FILES
router.delete('/all', verifyApiKey, checkUsageLimits, requireSecretKey, deleteAllFiles);

module.exports = router;