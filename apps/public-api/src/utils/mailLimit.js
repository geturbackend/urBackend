const { getPlanLimits } = require('@urbackend/common');

const padMonth = (month) => String(month).padStart(2, "0");

const getMonthKey = (now = new Date()) => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  return `${year}-${padMonth(month)}`;
};

const getEndOfMonthTtlSeconds = (now = new Date()) => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const nextMonthStart = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
  return Math.max(1, Math.ceil((nextMonthStart.getTime() - now.getTime()) / 1000));
};

const getMonthlyMailLimit = (project, planLimitsContext = null) => {
  // Primary path: planLimitsContext provided by usageGate middleware (plan-aware)
  if (planLimitsContext && planLimitsContext.mailPerMonth !== undefined) {
    return planLimitsContext.mailPerMonth;
  }

  // Fallback: project.owner is a raw ObjectId here, not a Developer doc,
  // so we cannot call resolveEffectivePlan safely. Apply free-tier + any
  // project-level customLimits as a safe default.
  const limits = getPlanLimits({
    plan: 'free',
    customLimits: project?.customLimits || null
  });
  
  return limits.mailPerMonth;
};

module.exports = {
  getMonthKey,
  getEndOfMonthTtlSeconds,
  getMonthlyMailLimit,
};
