const PLAN_LIMITS = {
  free: {
    // Projects & Collections
    maxProjects: 1,          // was: 1
    maxCollections: 5,       // was: 10 — tighter gate

    // Requests
    reqPerDay: 2000,         // was: 5000 — stronger push to Pro
    reqPerMinute: 30,        // was: 60 — free feels slower

    // Storage & DB
    storageBytes: 10485760,  // was: 20MB → now 10MB
    mongoBytes: 52428800,    // was: 50MB

    // Auth
    authUsersLimit: 200,     // was: 1000 — biggest change

    // Mail
    mailPerMonth: 25,        // was: 50 — half it
    mailTemplatesEnabled: false,

    // Webhooks
    webhooksLimit: 0,        // was: 100 — REMOVE from free entirely
    webhookRetryEnabled: false,

    // BYOM/BYOS/BYOK
    byomEnabled: true,       
    byosEnabled: false,      
    byokEnabled: false,      
    aiByokEnabled: false,

    // Features
    analyticsProEnabled: false,
    teamsEnabled: true,
    maxMembers: 2,           // owner + 1 member
  },

  pro: {
    // Projects & Collections
    maxProjects: 10,         
    maxCollections: -1,      // unlimited

    // Requests
    reqPerDay: -1,           // UNLIMITED
    reqPerMinute: 600,       

    // Storage & DB
    storageBytes: -1,        // BYOS enforced
    mongoBytes: -1,          // BYOM enforced

    // Auth
    authUsersLimit: -1,      // unlimited

    // Mail
    mailPerMonth: 1000,      
    mailTemplatesEnabled: true,

    // Webhooks
    webhooksLimit: -1,       // UNLIMITED
    webhookRetryEnabled: true,

    // BYOM/BYOS/BYOK
    byomEnabled: true,
    byosEnabled: true,
    byokEnabled: true,
    aiByokEnabled: true,

    // Features
    analyticsProEnabled: true,
    teamsEnabled: true,
    maxMembers: 6,           // owner + 5 members
  }
};

/**
 * Resolves the effective plan string for a developer, 
 * handling expiry and defaulting to 'free'.
 */
function resolveEffectivePlan(developer) {
  if (!developer) return 'free';
  
  // If plan expires, degrade to free
  if (developer.planExpiresAt && new Date(developer.planExpiresAt) < new Date()) {
    return 'free';
  }
  
  return developer.plan || 'free';
}

/**
 * Merges plan defaults with optional enterprise project overrides.
 * Only fields explicitly set (non-null) on overrides take effect.
 */
function mergeNullableOverrides(base, overrides) {
  if (!overrides) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== null && v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Applies legacy developer-level overrides ONLY when they are more generous
 * than the plan default. Legacy limits are admin-granted exceptions (e.g., 
 * "allow this user 5 projects even on free"). They must never reduce a paid
 * plan's higher entitlement (e.g., Pro allows 10 projects — a legacy value
 * of 1 must NOT override that, but a legacy value of 20 WILL override it to maintain the exception).
 */
function mergeLegacyOverrides(base, legacyLimits) {
  if (!legacyLimits) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(legacyLimits)) {
    if (v === null || v === undefined) continue;
    const baseVal = base[k];
    // -1 means unlimited in plan defaults; never downgrade from unlimited
    if (baseVal === -1) continue;
    // Only apply legacy value if it is strictly more generous than the plan default
    if (typeof v === 'number' && (v === -1 || v > baseVal)) {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Calculates the final active limits for a project.
 * Priority: Enterprise customLimits > Plan tier defaults (with legacy exceptions applied safely).
 */
function getPlanLimits({ plan, customLimits = null, legacyLimits = null }) {
  const base = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  
  // Apply legacy limits only when they INCREASE entitlement beyond plan defaults
  const withLegacy = mergeLegacyOverrides(base, legacyLimits);
  
  // Apply project-level enterprise overrides unconditionally
  const finalLimits = mergeNullableOverrides(withLegacy, customLimits);
  
  return finalLimits;
}

module.exports = { 
  PLAN_LIMITS, 
  resolveEffectivePlan, 
  getPlanLimits 
};
