export const getUsagePercentage = (used, limit) => {
  const numericUsed = Number(used) || 0;
  const numericLimit = Number(limit);

  if (numericLimit === -1) return 0;
  if (!Number.isFinite(numericLimit) || numericLimit <= 0) return null;

  return Math.max(0, Math.min(Math.round((numericUsed / numericLimit) * 100), 100));
};

export const getProgressWidth = (percentage) => (
  Number.isFinite(percentage) ? `${percentage}%` : '0%'
);
