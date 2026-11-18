'use strict';

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'signed_access_token'),
    verify: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    genSalt: jest.fn(() => 'salt'),
    hash: jest.fn(() => 'hashed_pw'),
}));

jest.mock('mongoose', () => ({
    Types: {
        ObjectId: jest.fn((id) => id),
    },
}));

const mockModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
};

jest.mock('@urbackend/common', () => {
    const z = require('zod');
    return {
        Project: {},
        redis: {
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn(),
            del: jest.fn().mockResolvedValue(1),
            incr: jest.fn().mockResolvedValue(1),
            expire: jest.fn().mockResolvedValue(1),
            ttl: jest.fn().mockResolvedValue(-1),
        },
        authEmailQueue: { add: jest.fn().mockResolvedValue(undefined) },
        loginSchema: z.object({
            email: z.string().email(),
            password: z.string().min(1),
        }),
        userSignupSchema: z.object({
            email: z.string().email(),
            password: z.string().min(6),
        }).passthrough(),
        resetPasswordSchema: z.object({
            email: z.string().email(),
            otp: z.string(),
            newPassword: z.string().min(6),
        }),
        onlyEmailSchema: z.object({ email: z.string().email() }),
        verifyOtpSchema: z.object({ email: z.string().email(), otp: z.string() }),
        changePasswordSchema: z.object({
            currentPassword: z.string().min(1),
            newPassword: z.string().min(6),
        }),
        sanitize: jest.fn((data) => data),
        getConnection: jest.fn().mockResolvedValue({}),
        getCompiledModel: jest.fn(() => mockModel),
        AppError: class AppError extends Error {
            constructor(statusCode, message, error = null) {
                super(message);
                this.statusCode = statusCode;
                this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
                this.error = error || (statusCode >= 500 ? "Internal Server Error" : "Error");
                this.isOperational = true;
            }
        },
        ApiResponse: class ApiResponse {
            constructor(d, m) {
                this.data = d;
                this.message = m;
                this.success = true;
            }
            send(res, code) {
                return res.status(code).json({ success: this.success, data: this.data, message: this.message });
            }
        },
        checkLockout: jest.fn().mockResolvedValue({ locked: false, retryAfterSeconds: 0 }),
        recordFailedAttempt: jest.fn().mockResolvedValue({ locked: false, retryAfterSeconds: 0, attempts: 1 }),
        clearLockout: jest.fn().mockResolvedValue(undefined),
    };
});

jest.mock('../utils/refreshToken', () => ({
    issueAuthTokens: jest.fn().mockResolvedValue({
        accessToken: 'signed_access_token',
        refreshToken: 'refresh_token_123',
        expiresIn: '15m',
    }),
    shouldExposeRefreshToken: jest.fn(() => true),
}));

const { AppError } = require('@urbackend/common');
const controller = require('../controllers/userAuth.controller');

const makeProject = (overrides = {}) => ({
    _id: 'project_1',
    name: 'Demo Project',
    jwtSecret: 'jwt_secret',
    isAuthEnabled: true,
    allowPublicSignup: true,
    resources: { db: { isExternal: false } },
    collections: [{
        name: 'users',
        model: [
            { key: 'email', type: 'String', required: true },
            { key: 'password', type: 'String', required: true },
            { key: 'isEmailVerified', type: 'Boolean', default: false },
        ],
    }],
    ...overrides,
});

const makeReq = ({ body = {}, project = makeProject() } = {}) => ({
    body,
    project,
    header: jest.fn(() => null),
    headers: {},
    cookies: {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
});

const makeRes = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
        cookie: jest.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
};

describe('POST /signup - allowPublicSignup enforcement', () => {
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        next = jest.fn();
    });

    test('rejects signup with 403 when allowPublicSignup is false', async () => {
        const project = makeProject({ allowPublicSignup: false });
        const req = makeReq({
            project,
            body: { email: 'test@example.com', password: 'password123' },
        });
        const res = makeRes();

        await controller.signup(req, res, next);

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: 403,
                message: 'Public signup is disabled for this project',
            })
        );
        expect(mockModel.create).not.toHaveBeenCalled();
    });

    test('allows signup when allowPublicSignup is true', async () => {
        const project = makeProject({ allowPublicSignup: true });
        mockModel.findOne.mockResolvedValue(null);
        mockModel.create.mockResolvedValue({
            _id: 'new_user_1',
            email: 'test@example.com',
            toObject: () => ({ _id: 'new_user_1', email: 'test@example.com' }),
        });

        const req = makeReq({
            project,
            body: { email: 'test@example.com', password: 'password123' },
        });
        const res = makeRes();

        await controller.signup(req, res, next);

        expect(next).not.toHaveBeenCalledWith(expect.any(AppError));
        expect(mockModel.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
