const mongoose = require("mongoose");

/**
 * Represents a pending team invitation for a project.
 * - Automatically deleted by MongoDB TTL index when expiresAt passes.
 * - Invitee must already have a Developer account; no open-ended invite links.
 */
const invitationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      required: true,
    },
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "viewer"],
      default: "admin",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Auto-delete expired invitations via MongoDB TTL index
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for quick "pending invitations for this user" lookups
invitationSchema.index({ invitee: 1, status: 1 });

// Prevent duplicate pending invitations for the same project+invitee
invitationSchema.index(
  { project: 1, invitee: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);

module.exports = mongoose.model("Invitation", invitationSchema);
