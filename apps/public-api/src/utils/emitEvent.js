const { PlatformEvent } = require('@urbackend/common');

/**
 * emitEvent (public-api variant) — fire-and-forget PlatformEvent writer.
 *
 * Identical contract to the dashboard-api version.
 * Never throws, never blocks the active request.
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
      console.error(`[emitEvent] Failed to write "${event}":`, err.message);
    }
  });
}

module.exports = { emitEvent };
