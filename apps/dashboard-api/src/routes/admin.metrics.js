const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  requireAdmin,
  getOverview,
  getActivationFunnel,
  getCohorts,
  getFeatureUsage,
  getReliability,
  getTopProjects,
  getChurnSignals,
} = require('../controllers/admin.metrics.controller');

// All admin routes require a valid dashboard session and isAdmin=true.
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/overview', getOverview);
router.get('/activation-funnel', getActivationFunnel);
router.get('/cohorts', getCohorts);
router.get('/feature-usage', getFeatureUsage);
router.get('/reliability', getReliability);
router.get('/top-projects', getTopProjects);
router.get('/churn-signals', getChurnSignals);

module.exports = router;
