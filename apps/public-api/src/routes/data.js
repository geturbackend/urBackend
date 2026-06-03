const express = require('express');
const router = express.Router();

const verifyApiKey = require('../middlewares/verifyApiKey');
const resolvePublicAuthContext = require('../middlewares/resolvePublicAuthContext');
const authorizeWriteOperation = require('../middlewares/authorizeWriteOperation');
const authorizeReadOperation = require('../middlewares/authorizeReadOperation');
const { checkUsageLimits } = require('../middlewares/usageGate');
const blockUsersCollectionDataAccess = require('../middlewares/blockUsersCollectionDataAccess');

const { 
  insertData, 
  bulkInsertData,   // ✅ bulk added
  getAllData, 
  getSingleDoc, 
  updateSingleData, 
  deleteSingleDoc, 
  recoverSingleDoc,
  aggregateData 
} = require("../controllers/data.controller");


// ✅ BULK INSERT ROUTE (MUST BE FIRST)
router.post(
  '/:collectionName/bulk',
  verifyApiKey,
  blockUsersCollectionDataAccess,
  checkUsageLimits,
  resolvePublicAuthContext,
  authorizeWriteOperation,
  bulkInsertData
);


// POST REQ TO INSERT SINGLE DATA
router.post(
  '/:collectionName',
  verifyApiKey,
  blockUsersCollectionDataAccess,
  checkUsageLimits,
  resolvePublicAuthContext,
  authorizeWriteOperation,
  insertData
);


// GET ALL DATA
router.get(
  '/:collectionName',
  verifyApiKey,
  blockUsersCollectionDataAccess,
  checkUsageLimits,
  resolvePublicAuthContext,
  authorizeReadOperation,
  getAllData
);


// AGGREGATION
router.post(
  '/:collectionName/aggregate',
  verifyApiKey,
  blockUsersCollectionDataAccess,
  checkUsageLimits,
  resolvePublicAuthContext,
  authorizeReadOperation,
  aggregateData
);


// GET SINGLE DATA
router.get(
  '/:collectionName/:id',
  verifyApiKey,
  blockUsersCollectionDataAccess,
  checkUsageLimits,
  resolvePublicAuthContext,
  authorizeReadOperation,
  getSingleDoc
);


// DELETE SINGLE DATA
router.delete(
  '/:collectionName/:id',
  verifyApiKey,
  blockUsersCollectionDataAccess,
  checkUsageLimits,
  resolvePublicAuthContext,
  authorizeWriteOperation,
  deleteSingleDoc
);

// RECOVER SOFT-DELETED DATA
router.patch(
  '/:collectionName/:id/recover',
  verifyApiKey,
  blockUsersCollectionDataAccess,
  checkUsageLimits,
  resolvePublicAuthContext,
  authorizeWriteOperation,
  recoverSingleDoc
);


// UPDATE (PUT)
router.put(
  '/:collectionName/:id',
  verifyApiKey,
  blockUsersCollectionDataAccess,
  checkUsageLimits,
  resolvePublicAuthContext,
  authorizeWriteOperation,
  updateSingleData
);


// UPDATE (PATCH)
router.patch(
  '/:collectionName/:id',
  verifyApiKey,
  blockUsersCollectionDataAccess,
  checkUsageLimits,
  resolvePublicAuthContext,
  authorizeWriteOperation,
  updateSingleData
);

module.exports = router;