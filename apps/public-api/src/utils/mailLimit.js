const MONTHLY_FREE_MAIL_LIMIT = 100;

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

const getMonthlyMailLimit = () => {
  // v0.9.0 default: free tier limit for all projects.
  return MONTHLY_FREE_MAIL_LIMIT;
};

module.exports = {
  getMonthKey,
  getEndOfMonthTtlSeconds,
  getMonthlyMailLimit,
};
