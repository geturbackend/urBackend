const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const authFlexible = require("../middlewares/authFlexible");

router.get("/stats", authFlexible, analyticsController.getGlobalStats);
router.get("/activity", authFlexible, analyticsController.getRecentActivity);

module.exports = router;
