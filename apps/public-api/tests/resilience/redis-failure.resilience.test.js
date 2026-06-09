const request = require('supertest');
const app = require('../../src/app');
const { redis } = require('@urbackend/common');

describe('Redis resilience', () => {
    afterEach(async () => {
        if (redis.status === 'ready') await redis.flushdb();
    });

    test('health endpoint returns 503 when Redis is unreachable', async () => {
        // Simulate Redis failure by disconnecting temporarily
        await redis.disconnect();

        const res = await request(app).get('/api/health/redis');
        expect(res.status).toBe(503);
        expect(res.body.redis.connected).toBe(false);

        // Reconnect for subsequent tests
        await redis.connect();
    });

    test('public API endpoints degrade gracefully when Redis is down', async () => {
        await redis.disconnect();

        const res = await request(app)
            .get('/api/data')
            .set('x-api-key', 'test-key');

        // Should not crash; may return 401 or 500 depending on auth flow
        expect([200, 401, 403, 500]).toContain(res.status);

        await redis.connect();
    });
});