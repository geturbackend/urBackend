const DEFAULT_DAILY_TTL_SECONDS = 90000; // 25 hours

const padMonth = (month) => String(month).padStart(2, "0");

const getDayKey = (now = new Date()) => now.toISOString().split("T")[0];

const getMonthKey = (now = new Date()) =>
  `${now.getUTCFullYear()}-${padMonth(now.getUTCMonth() + 1)}`;

const getEndOfMonthTtlSeconds = (now = new Date()) => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const nextMonthStart = new Date(
    Date.UTC(year, month + 1, 1, 0, 0, 0),
  );
  return Math.max(
    1,
    Math.ceil((nextMonthStart.getTime() - now.getTime()) / 1000),
  );
};

const incrWithTtlAtomic = async (
  redisClient,
  key,
  ttlSeconds = DEFAULT_DAILY_TTL_SECONDS,
  amount = 1,
) => {
  if (!redisClient || redisClient.status !== "ready") return Promise.resolve();

  const incrementBy = Number.isFinite(Number(amount))
    ? Math.trunc(Number(amount))
    : 1;
  if (incrementBy <= 0) return Promise.resolve();

  const luaScript = `
    local current = redis.call("INCRBY", KEYS[1], ARGV[1])
    if current == tonumber(ARGV[1]) then
      redis.call("EXPIRE", KEYS[1], ARGV[2])
    end
    return current
  `;

  return redisClient.eval(luaScript, 1, key, incrementBy, ttlSeconds);
};

module.exports = {
  getDayKey,
  getMonthKey,
  getEndOfMonthTtlSeconds,
  DEFAULT_DAILY_TTL_SECONDS,
  incrWithTtlAtomic,
};
