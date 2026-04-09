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
    });

    test('returns ok when mongodb and redis are connected', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.dependencies).toEqual({
            mongodb: 'connected',
            redis: 'connected',
        });
        expect(typeof res.body.timestamp).toBe('string');
        expect(mockRedis.ping).toHaveBeenCalledTimes(1);
    });

    test('returns error when mongodb is disconnected', async () => {
        mongoose.connection.readyState = 0;

        const res = await request(app).get('/api/health');

        expect(res.status).toBe(503);
        expect(res.body.status).toBe('error');
        expect(res.body.dependencies).toEqual({
            mongodb: 'disconnected',
            redis: 'connected',
        });
    });

    test('returns error when redis is not responsive', async () => {
        mockRedis.ping.mockRejectedValue(new Error('redis unavailable'));

        const res = await request(app).get('/api/health');

        expect(res.status).toBe(503);
        expect(res.body.status).toBe('error');
        expect(res.body.dependencies).toEqual({
            mongodb: 'connected',
            redis: 'disconnected',
        });
    });
});
