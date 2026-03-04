const express = require('express');
const router = express.Router();
const verifyApiKey = require('../middleware/verifyApiKey');
const requireSecretKey = require('../middleware/requireSecretKey');
const projectRateLimiter = require('../middleware/projectRateLimiter');
const { getCompiledModel } = require("../utils/injectModel");
const { insertData, getAllData, getSingleDoc, updateSingleData, deleteSingleDoc } = require("../controllers/data.controller")


// POST REQ TO INSERT DATA
router.post('/:collectionName', verifyApiKey, projectRateLimiter, requireSecretKey, insertData);


// GET REQ ALL DATA
router.get('/:collectionName', verifyApiKey, projectRateLimiter, getAllData);


// GET REQ SINGLE DATA
router.get('/:collectionName/:id', verifyApiKey, projectRateLimiter, getSingleDoc);


// DELETE REQ SINGLE DATA
router.delete('/:collectionName/:id', verifyApiKey, projectRateLimiter, requireSecretKey, deleteSingleDoc);



// PUT REQ SINGLE DATA
router.put('/:collectionName/:id', verifyApiKey, projectRateLimiter, requireSecretKey, updateSingleData);


module.exports = router;