const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const invitation = require("../controllers/invitation.controller");

// All invitation routes require dashboard auth
router.use(authMiddleware);

/**
 * GET /api/invitations
 * Get all pending invitations for the logged-in developer.
 */
router.get("/", invitation.getMyInvitations);

/**
 * POST /api/invitations/:id/accept
 * Accept a pending invitation.
 */
router.post("/:id/accept", invitation.acceptInvitation);

/**
 * POST /api/invitations/:id/decline
 * Decline a pending invitation.
 */
router.post("/:id/decline", invitation.declineInvitation);

module.exports = router;
