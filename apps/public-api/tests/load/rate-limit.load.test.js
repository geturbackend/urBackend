const autocannon = require('autocannon');
const { redis } = require('@urbackend/common');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:1235';
const API_KEY = process.env.TEST_API_KEY || 'test-api-key';

async function runRateLimitLoadTest() {
    console.log('🚀 Starting rate limit load test...\n');

    // Warm up: clear any existing rate limit keys
    const keys = await redis.keys('rl:project:*');
    if (keys.length) await redis.del(...keys);
    console.log(`Cleared ${keys.length} existing rate limit keys\n`);

    const instance = autocannon({
        url: `${TARGET_URL}/api/data`,
        connections: 100,
        duration: 30,
        headers: { 'x-api-key': API_KEY },
        requests: [{ method: 'GET' }],
    });

    autocannon.track(instance, { renderProgressBar: true });

    const result = await instance;
    console.log('\n📊 Results:');
    console.log(`  2xx: ${result['2xx']}`);
    console.log(`  429: ${result['429']}`);
    console.log(`  Mean latency: ${result.latency.mean}ms`);
    console.log(`  P99 latency: ${result.latency.p99}ms`);
    console.log(`  Errors: ${result.errors}`);

    // Verify Redis keys were created
    const rlKeys = await redis.keys('rl:project:*');
    console.log(`\n🔑 Redis rate limit keys created: ${rlKeys.length}`);
}

if (require.main === module) {
    runRateLimitLoadTest().catch((err) => {
        console.error('Load test failed:', err);
        process.exit(1);
    });
}

module.exports = { runRateLimitLoadTest };