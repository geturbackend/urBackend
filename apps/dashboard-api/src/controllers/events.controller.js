const { emitEvent } = require('../utils/emitEvent');

// Allowed frontend-emitted event names (whitelist prevents garbage in DB)
const ALLOWED_FRONTEND_EVENTS = new Set([
  'onboarding_step_viewed',
  'api_key_copied',
  'api_key_viewed',
  'sdk_code_copied',
  'docs_opened',
  'ai_schema_accepted',
  'ai_schema_rejected',
  'ai_generation_started',
]);

/**
 * POST /api/events/track
 *
 * Receives frontend-emitted tracking events and writes them as PlatformEvents.
 * Only whitelisted event names are accepted to prevent junk data.
 */
module.exports.track = async (req, res) => {
  try {
    const { event, properties = {}, projectId } = req.body;

    if (!event || typeof event !== 'string') {
      return res.status(400).json({ success: false, data: {}, message: 'event name is required' });
    }

    const normalizedEvent = event.trim().toLowerCase().replace(/\s+/g, '_');

    if (!ALLOWED_FRONTEND_EVENTS.has(normalizedEvent)) {
      return res.status(400).json({
        success: false,
        data: {},
        message: `Unknown event: "${normalizedEvent}". Allowed: ${[...ALLOWED_FRONTEND_EVENTS].join(', ')}`,
      });
    }

    // emitEvent is fire-and-forget — responds 200 immediately
    emitEvent(
      req.user._id,
      normalizedEvent,
      { ...properties, _source: 'frontend' },
      projectId || null,
    );

    return res.json({ success: true, data: {}, message: 'Event queued' });
  } catch (err) {
    console.error('[events.controller] track error:', err);
    return res.status(500).json({ success: false, data: {}, message: 'Internal server error' });
  }
};
