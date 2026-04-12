'use strict';

// ---------------------------------------------------------------------------
// Mock every dependency before the router module is loaded.
// ---------------------------------------------------------------------------

// Mock authMiddleware to be a transparent pass-through (tested separately).
jest.mock('../middlewares/authMiddleware', () =>
    jest.fn((_req, _res, next) => next())
);

// Mock auth_limiter to pass all requests through.
jest.mock('../middlewares/auth_limiter', () => ({
    authLimiter: jest.fn((_req, _res, next) => next()),
}));

// Mock express-rate-limit so dashboardLimiter also passes all requests.
jest.mock('express-rate-limit', () =>
    jest.fn(() => jest.fn((_req, _res, next) => next()))
);

// Provide simple stub controllers to isolate route wiring logic.
jest.mock('../controllers/auth.controller', () => ({
    register: jest.fn((_req, res) => res.status(201).json({ message: 'registered' })),
    login: jest.fn((_req, res) => res.json({ token: 'abc' })),
    changePassword: jest.fn((_req, res) => res.json({ message: 'password changed' })),
    deleteAccount: jest.fn((_req, res) => res.json({ message: 'deleted' })),
    sendOtp: jest.fn((_req, res) => res.json({ message: 'otp sent' })),
    verifyOtp: jest.fn((_req, res) => res.json({ message: 'otp verified' })),
    forgotPassword: jest.fn((_req, res) => res.json({ message: 'otp sent' })),
    resetPassword: jest.fn((_req, res) => res.json({ message: 'password reset' })),
    logout: jest.fn((_req, res) => res.json({ message: 'logged out' })),
    refreshToken: jest.fn((_req, res) => res.json({ token: 'new-token' })),
    getMe: jest.fn((_req, res) => res.json({ user: {} })),
    startGithubAuth: jest.fn((_req, res) => res.redirect('https://github.com/login/oauth/authorize')),
    handleGithubCallback: jest.fn((_req, res) => res.redirect('http://localhost:5173/dashboard')),
}));

// ---------------------------------------------------------------------------
// Build a minimal express application with the router mounted.
// ---------------------------------------------------------------------------

const express = require('express');
const request = require('supertest');
const authRouter = require('../routes/auth');
const authMiddleware = require('../middlewares/authMiddleware');
const authController = require('../controllers/auth.controller');

let app;

beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    // Stub csrfToken so GET /csrf-token does not crash.
    app.use((_req, _res, next) => {
        _req.csrfToken = () => 'csrf-test-token';
        next();
    });
    app.use('/api/auth', authRouter);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('auth routes', () => {
    describe('POST /api/auth/register', () => {
        test('is wired and returns 201', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'a@b.com', password: 'pass' });

            expect(res.status).toBe(201);
            expect(authController.register).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/auth/login', () => {
        test('is wired and returns 200', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'a@b.com', password: 'pass' });

            expect(res.status).toBe(200);
            expect(authController.login).toHaveBeenCalledTimes(1);
        });
    });

    describe('GET /api/auth/github/start', () => {
        test('is wired and redirects', async () => {
            const res = await request(app).get('/api/auth/github/start');

            expect(res.status).toBe(302);
            expect(authController.startGithubAuth).toHaveBeenCalledTimes(1);
        });
    });

    describe('GET /api/auth/github/callback', () => {
        test('is wired and redirects', async () => {
            const res = await request(app).get('/api/auth/github/callback?code=test&state=test');

            expect(res.status).toBe(302);
            expect(authController.handleGithubCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('PUT /api/auth/change-password', () => {
        test('is wired and protected by authMiddleware', async () => {
            const res = await request(app)
                .put('/api/auth/change-password')
                .send({ currentPassword: 'old', newPassword: 'new123' });

            expect(res.status).toBe(200);
            // authMiddleware (mocked) should have been invoked.
            expect(authMiddleware).toHaveBeenCalled();
            expect(authController.changePassword).toHaveBeenCalledTimes(1);
        });
    });

    describe('DELETE /api/auth/delete-account', () => {
        test('is wired and protected by authMiddleware', async () => {
            const res = await request(app)
                .delete('/api/auth/delete-account')
                .send({ password: 'mypass' });

            expect(res.status).toBe(200);
            expect(authMiddleware).toHaveBeenCalled();
            expect(authController.deleteAccount).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/auth/send-otp', () => {
        test('is wired (no auth required)', async () => {
            const res = await request(app)
                .post('/api/auth/send-otp')
                .send({ email: 'a@b.com' });

            expect(res.status).toBe(200);
            expect(authController.sendOtp).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/auth/verify-otp', () => {
        test('is wired (no auth required)', async () => {
            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ email: 'a@b.com', otp: '123456' });

            expect(res.status).toBe(200);
            expect(authController.verifyOtp).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        test('is wired (no auth required)', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'a@b.com' });

            expect(res.status).toBe(200);
            expect(authController.forgotPassword).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/auth/reset-password', () => {
        test('is wired (no auth required)', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({ email: 'a@b.com', otp: '123456', newPassword: 'new123' });

            expect(res.status).toBe(200);
            expect(authController.resetPassword).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/auth/refresh-token', () => {
        test('is wired (no auth required)', async () => {
            const res = await request(app).post('/api/auth/refresh-token');

            expect(res.status).toBe(200);
            expect(authController.refreshToken).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/auth/logout', () => {
        test('is wired and protected by authMiddleware', async () => {
            const res = await request(app).post('/api/auth/logout');

            expect(res.status).toBe(200);
            expect(authMiddleware).toHaveBeenCalled();
            expect(authController.logout).toHaveBeenCalledTimes(1);
        });
    });

    describe('GET /api/auth/me', () => {
        test('is wired and protected by authMiddleware', async () => {
            const res = await request(app).get('/api/auth/me');

            expect(res.status).toBe(200);
            expect(authMiddleware).toHaveBeenCalled();
            expect(authController.getMe).toHaveBeenCalledTimes(1);
        });
    });

    describe('GET /api/auth/csrf-token', () => {
        test('returns a CSRF token', async () => {
            const res = await request(app).get('/api/auth/csrf-token');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('csrfToken');
        });
    });
});
