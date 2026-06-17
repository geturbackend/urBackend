/**
 * Shared project access-control helpers.
 *
 * Centralises the "owner OR member" logic so every controller and middleware
 * uses the same query pattern instead of hardcoding { owner: userId }.
 */

/**
 * Returns a MongoDB query fragment that matches projects accessible by userId —
 * either as the owner or as a member.
 *
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @returns {{ $or: Array }}
 */
const getProjectAccessQuery = (userId) => ({
  $or: [{ owner: userId }, { "members.user": userId }],
});

/**
 * Determines the role of a user within a project document.
 *
 * @param {object} project - Mongoose project document or plain object
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @returns {'owner' | 'admin' | 'viewer' | null}
 */
const getProjectRole = (project, userId) => {
  const uid = userId.toString();
  if (project.owner?.toString() === uid) return "owner";
  const member = project.members?.find((m) => m.user?.toString() === uid);
  return member ? member.role : null;
};

module.exports = { getProjectAccessQuery, getProjectRole };
