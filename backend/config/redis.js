const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

/**
 * TEST MODE → fake redis
 */
if (process.env.NODE_ENV === "test") {
  console.warn("⚠️ Redis disabled in test environment");

  const dummyRedis = {
    status: "ready",
    get: async () => null,
    set: async () => null,
    del: async () => null,
    quit: async () => null,
    on: () => {}, // some modules attach listeners
  };

  module.exports = dummyRedis;

} else {

  /**
   * DEV / PROD → real redis
   */
  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV !== "production") {
      console.log("DEBUG: ENV KEYS:", Object.keys(process.env));
    }
    throw new Error("REDIS_URL is not defined in .env");
  }

  const redis = new Redis(process.env.REDIS_URL, {
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      if (times > 3) {
        console.warn("⚠️ Redis: Max retries reached. Caching will be disabled.");
        return null;
      }
      return delay;
    },
    maxRetriesPerRequest: null,
  });

  redis.on("ready", () => {
    console.log("ioredis client is connected and ready.");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis Connection Error:", err.message);
    console.error("   -> Ensure Redis is running on localhost:6379");
    console.error("   -> Windows: Use WSL or a Memurai/Redis port.");
  });

  module.exports = redis;
}
