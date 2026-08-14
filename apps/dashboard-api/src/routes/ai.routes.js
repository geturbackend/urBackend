const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams is crucial to access :projectId
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// All AI routes require the user to be authenticated
router.use(authMiddleware);

/**
 * @route POST /api/projects/:projectId/ai/query-builder
 * @desc Generate MongoDB filters from natural language
 * @access Private
 */
router.post('/query-builder', aiController.queryBuilder);

/**
 * @route POST /api/projects/:projectId/ai/collection-creator
 * @desc Interactive chat with AI to create collection schema
 * @access Private
 */
router.post('/collection-creator', aiController.collectionCreator);

/**
 * @route DELETE /api/projects/:projectId/ai/collection-creator/session
 * @desc Clears the interactive chat session for collection creator
 * @access Private
 */
router.delete('/collection-creator/session', aiController.clearCollectionCreatorSession);

module.exports = router;
