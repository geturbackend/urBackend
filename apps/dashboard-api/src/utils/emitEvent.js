const { PlatformEvent } = require('@urbackend/common');

/**
 * emitEvent — fire-and-forget PlatformEvent writer.
 *
 * Never throws. Any failure is logged but never surfaces to the caller.
 * Use setImmediate so the current request completes before the DB write.
 *
 * @param {string|ObjectId} developerId   — required
 * @param {string}          event         — e.g. 'project_created'
 * @param {object}          [properties]  — optional context
 * @param {string|ObjectId} [projectId]   — optional
 */
function emitEvent(developerId, event, properties = {}, projectId = null) {
  setImmediate(async () => {
    try {
      await PlatformEvent.create({
        developerId,
        event,
        properties,
        projectId: projectId || null,
        timestamp: new Date(),
      });
    } catch (err) {
      // Never block the caller — just log
      console.error(`[emitEvent] Failed to write "${event}":`, err.message);
    }
  });
}

module.exports = { emitEvent };
