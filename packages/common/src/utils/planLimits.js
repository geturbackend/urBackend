const PLAN_LIMITS = {
  free: {
    maxProjects: 1,
    maxCollections: 10,
    reqPerDay: 5000,             // Advertised 5k, protected by Per-Minute limit
    reqPerMinute: 60,            // Strict protection for free tier
    storageBytes: 20971520,      // 20MB
    mongoBytes: 52428800,        // 50MB
    mailPerMonth: 50,
    authUsersLimit: 1000,
    byokEnabled: false,
    byomEnabled: true,           // BYOM always free
    analyticsProEnabled: false,
    teamsEnabled: false,
    aiByokEnabled: false,
    webhooksLimit: 100,          // 100/month
    webhookRetryEnabled: false,
    mailTemplatesEnabled: false
  },
  pro: {
    maxProjects: 10,
    maxCollections: -1,          // Unlimited
    reqPerDay: 50000,
    reqPerMinute: 600,           // 10x higher than free
    storageBytes: -1,            // Expected to use BYOS
    mongoBytes: -1,              // Expected to use BYOM
    mailPerMonth: 1000,
    authUsersLimit: -1,
    byokEnabled: true,
    byomEnabled: true,
    analyticsProEnabled: true,
    teamsEnabled: false,
    aiByokEnabled: true,         // OpenAI, Groq, Gemini
    webhooksLimit: 1000,         // 1000/month
    webhookRetryEnabled: true,
    mailTemplatesEnabled: true
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
 * of 1 or 20 must NOT override that).
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
