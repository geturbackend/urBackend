const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config()

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined in .env");
}

const redis = new Redis(process.env.REDIS_URL, {
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        if (times > 3) {
            console.warn("⚠️ Redis: Max retries reached. Caching will be disabled.");
            return null; // Stop retrying
        }
        return delay;
    },
    maxRetriesPerRequest: null // Allow requests to fail if not connected
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
