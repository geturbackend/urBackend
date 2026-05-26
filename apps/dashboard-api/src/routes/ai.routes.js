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

module.exports = router;
