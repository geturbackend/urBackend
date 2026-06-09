const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config()

if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV !== 'production') {
        console.log("DEBUG: ENV KEYS:", Object.keys(process.env));
    }
    throw new Error("REDIS_URL is not defined in .env");
}

const redis = new Redis(process.env.REDIS_URL, {
    retryStrategy(times) {
        if (times > 10) {
            console.warn("⚠️ Redis: Max retries reached. Caching will be disabled.");
            return null; // Stop retrying
        }
        const baseDelay = Math.min(Math.pow(2, times) * 100, 30000);
        const jitter = Math.floor(Math.random() * 100);
        const delay = baseDelay + jitter;
        console.log(`🔁 Redis retry attempt ${times}, next delay ${delay}ms`);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    disconnectTimeout: 2000,
    commandTimeout: 5000,
    lazyConnect: false,
    enableOfflineQueue: true,
    offlineQueue: true,
});

redis.on('ready', () => {
    console.log('ioredis client is connected and ready.');
});

redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err.message);
    console.error('   -> Ensure Redis is running on localhost:6379');
    console.error('   -> Windows: Use WSL or a Memurai/Redis port.');
    // Do not throw; lets the app continue without caching if needed
});

module.exports = redis;
