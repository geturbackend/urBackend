const mongoose = require('mongoose');
const { redis } = require('@urbackend/common');
const REDIS_PING_TIMEOUT_MS = 500;

const getHealth = async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;

    let isRedisConnected = false;
    if (redis?.status === 'ready' && typeof redis.ping === 'function') {
        try {
            const pingResponse = await Promise.race([
                redis.ping(),
                new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), REDIS_PING_TIMEOUT_MS)),
            ]);
            isRedisConnected = pingResponse === 'PONG';
        } catch (_error) {
            isRedisConnected = false;
        }
    }

    const status = isMongoConnected && isRedisConnected ? 'ok' : 'error';

    return res.status(status === 'ok' ? 200 : 503).json({
        status,
        timestamp: new Date().toISOString(),
        dependencies: {
            mongodb: isMongoConnected ? 'connected' : 'disconnected',
            redis: isRedisConnected ? 'connected' : 'disconnected',
        },
    });
};

const getRedisHealth = async (req, res) => {
    if (!redis || redis.status !== 'ready') {
        return res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            redis: { connected: false, error: 'Redis client not ready' },
        });
    }

    try {
        const info = await redis.info('stats');
        const memory = await redis.info('memory');
        const clients = await redis.info('clients');

        const parseInfo = (raw, key) => {
            const match = raw.match(new RegExp(`${key}:(\\d+)`));
            return match ? parseInt(match[1], 10) : null;
        };

        const parseInfoStr = (raw, key) => {
            const match = raw.match(new RegExp(`${key}:(.+)`));
            return match ? match[1].trim() : null;
        };

        const connectedClients = parseInfo(clients, 'connected_clients');
        const usedMemory = parseInfoStr(memory, 'used_memory_human');
        const totalCommands = parseInfo(info, 'total_commands_processed');

        return res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            redis: {
                connected: true,
                status: redis.status,
                connectedClients,
                usedMemory,
                totalCommandsProcessed: totalCommands,
                reconnectAttempts: redis.options?.retryStrategy ? 'enabled' : 'disabled',
            },
        });
    } catch (err) {
        return res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            redis: { connected: false, error: err.message },
        });
    }
};

module.exports = {
    getHealth,
    getRedisHealth,
};
