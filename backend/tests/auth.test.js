const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * CI / local fallback values
 * Tests should not depend on developer machine env.
 */
process.env.TEST_MONGO_URL =
  process.env.TEST_MONGO_URL || "mongodb://127.0.0.1:27017/urbackend_test";

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "ci_test_jwt_secret";


/**
 * Mock Redis
 */
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        quit: jest.fn().mockResolvedValue('OK'),
        status: 'ready',
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(null),
        del: jest.fn().mockResolvedValue(1),
    }));
});

/**
 * Mock email service
 */
jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => ({
            emails: {
                send: jest.fn().mockResolvedValue({ data: { id: 'mock_id' }, error: null }),
            },
        })),
    };
});

const app = require('../app');
const Developer = require('../models/Developer');
const bcrypt = require('bcryptjs');


// --- SETUP 
beforeAll(async () => {
    const uri = process.env.TEST_MONGO_URL;

    console.log("URI Length:", uri ? uri.length : 0);
    console.log("URI Starts with mongodb:", uri ? uri.startsWith('mongodb') : false);

    if (!uri || !uri.startsWith('mongodb')) {
        throw new Error(`Invalid TEST_MONGO_URL! Received: ${uri ? 'invalid format' : 'nothing'}`);
    }

    await mongoose.disconnect();
    await mongoose.connect(uri);
});

const redis = require('../config/redis');

afterAll(async () => {
    await mongoose.connection.close();
    await redis.quit();
});

describe('Auth API Security', () => {

    beforeEach(async () => {
        await Developer.deleteMany({});

        const hashedPassword = await bcrypt.hash('password123', 10);
        await Developer.create({ email: 'test@example.com', password: hashedPassword });
    });

    afterEach(async () => {
        await Developer.deleteMany({});
    });

    it('should login successfully with correct credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should BLOCK NoSQL Injection attempt (Zod Validation)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: { "$ne": null },
                password: 'password123'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});
