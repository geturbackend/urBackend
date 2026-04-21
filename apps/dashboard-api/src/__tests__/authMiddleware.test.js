'use strict';

jest.mock('jsonwebtoken');

const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

describe('authMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { cookies: {}, header: jest.fn() };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('cookie-based authentication', () => {
        test('accepts a valid token from the accessToken cookie', () => {
            req.cookies.accessToken = 'cookietoken';
            jwt.verify.mockReturnValue({ _id: 'user1' });

            authMiddleware(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('cookietoken', 'test-secret');
            expect(req.user).toEqual({ _id: 'user1' });
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('Authorization header — Bearer scheme case handling', () => {
        test('accepts Bearer <token> (standard case)', () => {
            req.header.mockReturnValue('Bearer validtoken');
            jwt.verify.mockReturnValue({ _id: 'user1' });

            authMiddleware(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test-secret');
            expect(req.user).toEqual({ _id: 'user1' });
            expect(next).toHaveBeenCalledTimes(1);
        });

        test('accepts bearer <token> (lowercase — regression from PR #55)', () => {
            req.header.mockReturnValue('bearer validtoken');
            jwt.verify.mockReturnValue({ _id: 'user1' });

            authMiddleware(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test-secret');
            expect(next).toHaveBeenCalledTimes(1);
        });

        test('accepts BEARER <token> (uppercase)', () => {
            req.header.mockReturnValue('BEARER validtoken');
            jwt.verify.mockReturnValue({ _id: 'user1' });

            authMiddleware(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test-secret');
            expect(next).toHaveBeenCalledTimes(1);
        });

        test('accepts BeArEr <token> (mixed case)', () => {
            req.header.mockReturnValue('BeArEr validtoken');
            jwt.verify.mockReturnValue({ _id: 'user1' });

            authMiddleware(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'test-secret');
            expect(next).toHaveBeenCalledTimes(1);
        });

        test('cookie takes priority over Authorization header', () => {
            req.cookies.accessToken = 'cookietoken';
            req.header.mockReturnValue('Bearer headertoken');
            jwt.verify.mockReturnValue({ _id: 'user1' });

            authMiddleware(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('cookietoken', 'test-secret');
            expect(next).toHaveBeenCalledTimes(1);
        });
    });

    describe('missing or malformed Authorization header', () => {
        test('rejects request with missing Authorization header and no cookie', () => {
            req.header.mockReturnValue(null);

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access Denied: No Token Provided',
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('rejects header with wrong scheme (Token)', () => {
            req.header.mockReturnValue('Token sometoken');

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        test('rejects header with no scheme (bare token only)', () => {
            req.header.mockReturnValue('justtoken');

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        test('rejects empty Authorization header', () => {
            req.header.mockReturnValue('');

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        test('rejects header with extra whitespace but no token value', () => {
            req.header.mockReturnValue('Bearer  ');

            authMiddleware(req, res, next);

            // After trimming and splitting on whitespace, only the scheme 'Bearer'
            // remains and there is no token part, so it's treated as missing token.
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('JWT verification errors', () => {
        test('rejects an expired JWT', () => {
            req.header.mockReturnValue('Bearer expiredtoken');
            jwt.verify.mockImplementation(() => {
                const err = new Error('jwt expired');
                err.name = 'TokenExpiredError';
                throw err;
            });

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid Token' });
            expect(next).not.toHaveBeenCalled();
        });

        test('rejects a malformed / invalid JWT', () => {
            req.header.mockReturnValue('Bearer invalidtoken');
            jwt.verify.mockImplementation(() => {
                const err = new Error('invalid token');
                err.name = 'JsonWebTokenError';
                throw err;
            });

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid Token' });
            expect(next).not.toHaveBeenCalled();
        });

        test('attaches decoded payload to req.user on success', () => {
            req.header.mockReturnValue('Bearer goodtoken');
            const decoded = { _id: 'abc', isVerified: true, maxProjects: 5 };
            jwt.verify.mockReturnValue(decoded);

            authMiddleware(req, res, next);

            expect(req.user).toEqual(decoded);
            expect(next).toHaveBeenCalledTimes(1);
        });
    });
});
