'use strict';

const mockRedis = {
    status: 'ready',
    ping: jest.fn(),
};

jest.mock('mongoose', () => ({
    connection: {
        readyState: 1,
    },
}));

jest.mock('@urbackend/common', () => ({
    AppError: class AppError extends Error { constructor(code, msg, errTitle) { super(msg); this.statusCode=code; this.error=errTitle||'Error'; } },
    ApiResponse: class ApiResponse { constructor(d, m) { this.data=d; this.message=m; this.success=true; } send(res, code) { return res.status(code).json({ success: this.success, data: this.data, message: this.message }); } },
    redis: mockRedis,
}));

const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const healthRoute = require('../routes/health');

describe('health route', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        mongoose.connection.readyState = 1;
        mockRedis.status = 'ready';
        mockRedis.ping.mockResolvedValue('PONG');

        app = express();
        app.use('/api/health', healthRoute);
        app.use((err, req, res, next) => {
            res.status(err.statusCode || 500).json({ success: false, error: err.error, message: err.message });
        });
    });

    test('returns ok when mongodb and redis are connected', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('ok');
        expect(res.body.data.dependencies).toEqual({
            mongodb: 'connected',
            redis: 'connected',
        });
        expect(typeof res.body.data.timestamp).toBe('string');
        expect(mockRedis.ping).toHaveBeenCalledTimes(1);
    });

    test('returns error when mongodb is disconnected', async () => {
        mongoose.connection.readyState = 0;

        const res = await request(app).get('/api/health');

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Service unavailable');
    });

    test('returns error when redis is not responsive', async () => {
        mockRedis.ping.mockRejectedValue(new Error('redis unavailable'));

        const res = await request(app).get('/api/health');

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Service unavailable');
    });
});
