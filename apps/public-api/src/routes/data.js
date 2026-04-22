const express = require('express');
const router = express.Router();
const verifyApiKey = require('../middlewares/verifyApiKey');
const resolvePublicAuthContext = require('../middlewares/resolvePublicAuthContext');
const authorizeWriteOperation = require('../middlewares/authorizeWriteOperation');
const authorizeReadOperation = require('../middlewares/authorizeReadOperation');
const { checkUsageLimits } = require('../middlewares/usageGate');
const blockUsersCollectionDataAccess = require('../middlewares/blockUsersCollectionDataAccess');
const { insertData, getAllData, getSingleDoc, updateSingleData, deleteSingleDoc, aggregateData } = require("../controllers/data.controller")


// POST REQ TO INSERT DATA
router.post('/:collectionName', verifyApiKey, blockUsersCollectionDataAccess, checkUsageLimits, resolvePublicAuthContext, authorizeWriteOperation, insertData);


// GET REQ ALL DATA
router.get('/:collectionName', verifyApiKey, blockUsersCollectionDataAccess, checkUsageLimits, resolvePublicAuthContext, authorizeReadOperation, getAllData);

// POST REQ AGGREGATION DATA
router.post('/:collectionName/aggregate', verifyApiKey, blockUsersCollectionDataAccess, checkUsageLimits, resolvePublicAuthContext, authorizeReadOperation, aggregateData);


// GET REQ SINGLE DATA
router.get('/:collectionName/:id', verifyApiKey, blockUsersCollectionDataAccess, checkUsageLimits, resolvePublicAuthContext, authorizeReadOperation, getSingleDoc);


// DELETE REQ SINGLE DATA
router.delete('/:collectionName/:id', verifyApiKey, blockUsersCollectionDataAccess, checkUsageLimits, resolvePublicAuthContext, authorizeWriteOperation, deleteSingleDoc);



// PUT REQ SINGLE DATA
router.put('/:collectionName/:id', verifyApiKey, blockUsersCollectionDataAccess, checkUsageLimits, resolvePublicAuthContext, authorizeWriteOperation, updateSingleData);

// PATCH REQ SINGLE DATA
router.patch('/:collectionName/:id', verifyApiKey, blockUsersCollectionDataAccess, checkUsageLimits, resolvePublicAuthContext, authorizeWriteOperation, updateSingleData);


module.exports = router;
