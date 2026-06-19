const mongoose = require('mongoose');
const { redis, ApiResponse, AppError } = require('@urbackend/common');
const REDIS_PING_TIMEOUT_MS = 500;

const getHealth = async (req, res, next) => {
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
    const payload = {
        status,
        timestamp: new Date().toISOString(),
        dependencies: {
            mongodb: isMongoConnected ? 'connected' : 'disconnected',
            redis: isRedisConnected ? 'connected' : 'disconnected',
        },
    };

    if (status === 'ok') {
        return new ApiResponse(payload, "Health Check Passed").send(res, 200);
    } else {
        return next(new AppError(503, "Service unavailable", "Health Check Failed"));
    }
};

module.exports = {
    getHealth,
};
