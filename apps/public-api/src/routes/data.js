const express = require('express');
const router = express.Router();
const verifyApiKey = require('../middlewares/verifyApiKey');
const resolvePublicAuthContext = require('../middlewares/resolvePublicAuthContext');
const authorizeWriteOperation = require('../middlewares/authorizeWriteOperation');
const authorizeReadOperation = require('../middlewares/authorizeReadOperation');
const projectRateLimiter = require('../middlewares/projectRateLimiter');
const blockUsersCollectionDataAccess = require('../middlewares/blockUsersCollectionDataAccess');
const { insertData, insertBulkData, getAllData, getSingleDoc, updateSingleData, deleteSingleDoc, aggregateData } = require("../controllers/data.controller")


// POST REQ TO INSERT DATA
router.post('/:collectionName', verifyApiKey, blockUsersCollectionDataAccess, resolvePublicAuthContext, projectRateLimiter, authorizeWriteOperation, insertData);

// POST REQ TO INSERT BULK DATA
router.post('/:collectionName/bulk', verifyApiKey, blockUsersCollectionDataAccess, resolvePublicAuthContext, projectRateLimiter, authorizeWriteOperation, insertBulkData);


// GET REQ ALL DATA
router.get('/:collectionName', verifyApiKey, blockUsersCollectionDataAccess, resolvePublicAuthContext, projectRateLimiter, authorizeReadOperation, getAllData);

// POST REQ AGGREGATION DATA
router.post('/:collectionName/aggregate', verifyApiKey, blockUsersCollectionDataAccess, resolvePublicAuthContext, projectRateLimiter, authorizeReadOperation, aggregateData);


// GET REQ SINGLE DATA
router.get('/:collectionName/:id', verifyApiKey, blockUsersCollectionDataAccess, resolvePublicAuthContext, projectRateLimiter, authorizeReadOperation, getSingleDoc);


// DELETE REQ SINGLE DATA
router.delete('/:collectionName/:id', verifyApiKey, blockUsersCollectionDataAccess, resolvePublicAuthContext, projectRateLimiter, authorizeWriteOperation, deleteSingleDoc);



// PUT REQ SINGLE DATA
router.put('/:collectionName/:id', verifyApiKey, blockUsersCollectionDataAccess, resolvePublicAuthContext, projectRateLimiter, authorizeWriteOperation, updateSingleData);

// PATCH REQ SINGLE DATA
router.patch('/:collectionName/:id', verifyApiKey, blockUsersCollectionDataAccess, resolvePublicAuthContext, projectRateLimiter, authorizeWriteOperation, updateSingleData);


module.exports = router;
