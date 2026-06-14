const { Invitation, Project, Developer, AppError, ApiResponse, getProjectAccessQuery, deleteProjectById, resolveEffectivePlan, getPlanLimits } = require("@urbackend/common");

/**
 * GET /api/invitations
 * Returns all pending invitations for the currently logged-in developer.
 */
module.exports.getMyInvitations = async (req, res, next) => {
  try {
    const invitations = await Invitation.find({
      invitee: req.user._id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("project", "name description")
      .populate("inviter", "email name")
      .lean();

    const formatted = invitations
      .filter((inv) => inv.project && inv.inviter)
      .map((inv) => ({
        _id: inv._id,
        project: {
          _id: inv.project._id,
          name: inv.project.name,
          description: inv.project.description,
        },
        invitedBy: {
          email: inv.inviter.email,
          name: inv.inviter.name,
        },
        role: inv.role,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      }));

    return new ApiResponse(formatted).send(res);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/invitations/:id/accept
 * Invitee accepts — gets added to project.members[].
 */
module.exports.acceptInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findOne({
      _id: id,
      invitee: req.user._id,
      status: "pending",
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!invitation) {
      return next(new AppError(404, "Invitation not found, already used, or expired"));
    }

    // Check the member limit is not exceeded
    const project = await Project.findById(invitation.project).select("owner members customLimits").lean();
    if (!project) return next(new AppError(404, "Project no longer exists"));

    // Make sure invitee is not already a member (edge case — duplicate accept)
    const alreadyMember = project.members?.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      // Silently clean up and tell them they're in
      await Invitation.findByIdAndUpdate(id, { status: "accepted" });
      return new ApiResponse(
        { projectId: project._id },
        "You are already a member of this project",
      ).send(res);
    }

    const ownerDev = await Developer.findById(project.owner).lean();
    const limits = getPlanLimits(resolveEffectivePlan(ownerDev, project.customLimits));
    const maxNonOwnerMembersAllowed = limits.maxMembers - 1; // Owner counts as 1

    // Add member to project atomically and check limit
    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: invitation.project,
        "members.user": { $ne: req.user._id },
        $expr: {
          $lt: [
            { $size: { $ifNull: ["$members", []] } },
            maxNonOwnerMembersAllowed
          ]
        }
      },
      {
        $push: {
          members: {
            user: req.user._id,
            role: invitation.role,
            addedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedProject) {
      return next(new AppError(400, "Project member limit reached or project not found"));
    }

    await Invitation.findByIdAndUpdate(id, { status: "accepted" });

    // INVALIDATE CACHE
    await deleteProjectById(invitation.project.toString()).catch(() => {});

    return new ApiResponse(
      { projectId: invitation.project, role: invitation.role },
      "Invitation accepted — you are now a member of the project",
    ).send(res, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/invitations/:id/decline
 * Invitee declines — invitation is marked as declined.
 */
module.exports.declineInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findOneAndUpdate(
      {
        _id: id,
        invitee: req.user._id,
        status: "pending",
        expiresAt: { $gt: new Date() },
      },
      { status: "declined" },
    );

    if (!invitation) {
      return next(new AppError(404, "Invitation not found, already used, or expired"));
    }

    return new ApiResponse({}, "Invitation declined").send(res);
  } catch (err) {
    next(err);
  }
};
