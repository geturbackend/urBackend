const express = require('express');
const router = express.Router();
const authorization = require('../middleware/authMiddleware');
const { getAllReleases, createRelease } = require('../controllers/release.controller');
const RateLimit = require('express-rate-limit');

const getAllReleasesLimiter = RateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
});

// GET ALL RELEASES (Public)
router.get('/', getAllReleasesLimiter, getAllReleases);

const createReleaseLimiter = RateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 , 
});
// CREATE RELEASE (Admin Only)
router.post('/', createReleaseLimiter, createRelease);

module.exports = router;
