'use strict';

jest.mock('../middlewares/authMiddleware', () =>
    jest.fn((req, _res, next) => {
        req.user = { _id: 'mock_user_id', email: 'test@example.com' };
        next();
    })
);

jest.mock('../controllers/auth.controller', () => ({
    getMe: jest.fn((_req, res) => res.json({
        success: true,
        data: {
            user: {
                onboarding: {
                    completed: false,
                    steps: {
                        projectCreated: false,
                        collectionCreated: false,
                        firstApiCall: false,
                    },
                    activationAt: null,
                },
            },
        },
        message: 'Success',
    })),
    updateOnboarding: jest.fn((_req, res) => res.json({
        success: true,
        data: {
            onboarding: {
                completed: false,
                steps: {
                    projectCreated: true,
                    collectionCreated: false,
                    firstApiCall: false,
                },
                activationAt: null,
            },
        },
        message: 'Onboarding updated successfully',
    })),
}));

const express = require('express');
const request = require('supertest');
const userRouter = require('../routes/user');
const authMiddleware = require('../middlewares/authMiddleware');
const authController = require('../controllers/auth.controller');

describe('user routes', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        app.use('/api/user', userRouter);
    });

    test('GET /api/user/me is wired to authenticated getMe', async () => {
        const res = await request(app).get('/api/user/me');

        expect(res.status).toBe(200);
        expect(authMiddleware).toHaveBeenCalledTimes(1);
        expect(authController.getMe).toHaveBeenCalledTimes(1);
        expect(res.body.data.user.onboarding).toEqual({
            completed: false,
            steps: {
                projectCreated: false,
                collectionCreated: false,
                firstApiCall: false,
            },
            activationAt: null,
        });
    });

    test('PATCH /api/user/onboarding is wired to authenticated updateOnboarding', async () => {
        const res = await request(app)
            .patch('/api/user/onboarding')
            .send({ steps: { projectCreated: true } });

        expect(res.status).toBe(200);
        expect(authMiddleware).toHaveBeenCalledTimes(1);
        expect(authController.updateOnboarding).toHaveBeenCalledTimes(1);
        expect(res.body.data.onboarding.steps.projectCreated).toBe(true);
    });
});
