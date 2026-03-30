'use strict';

const crypto = require('crypto');

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'signed_access_token'),
    verify: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn(),
}));

jest.mock('mongoose', () => ({
    Types: {
        ObjectId: jest.fn((id) => id),
    },
}));

jest.mock('@urbackend/common', () => {
    const z = require('zod');
    const mockModel = {
        findOne: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
    };

    const projectFindByIdChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn(),
    };

    return {
        Project: {
            findById: jest.fn(() => projectFindByIdChain),
            __chain: projectFindByIdChain,
        },
        redis: {
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn(),
            del: jest.fn().mockResolvedValue(1),
            incr: jest.fn().mockResolvedValue(1),
            expire: jest.fn().mockResolvedValue(1),
            sadd: jest.fn().mockResolvedValue(1),
            srem: jest.fn().mockResolvedValue(1),
            smembers: jest.fn().mockResolvedValue([]),
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
        __mockModel: mockModel,
        // session manager exports
        getRefreshSession: jest.fn(),
        persistRefreshSession: jest.fn().mockResolvedValue(undefined),
        revokeSessionChain: jest.fn().mockResolvedValue(undefined),
        getUserActiveSessions: jest.fn().mockResolvedValue([]),
        getRefreshSessionKey: jest.fn((tokenId) => `project:auth:refresh:session:${tokenId}`),
        getUserSessionsKey: jest.fn((projectId, userId) => `project:${projectId}:user:${userId}:sessions`),
    };
});

const bcrypt = require('bcryptjs');
const { Project, redis, getRefreshSession, persistRefreshSession, __mockModel: mockModel } = require('@urbackend/common');
const controller = require('../controllers/userAuth.controller');

const makeProject = () => ({
    _id: 'project_1',
    name: 'Demo',
    jwtSecret: 'jwt_secret',
    isAuthEnabled: true,
    resources: { db: { isExternal: false } },
    collections: [{ name: 'users', model: [{ key: 'email' }, { key: 'password' }] }],
});

const makeReq = ({ body = {}, headers = {}, cookies = {}, project = makeProject() } = {}) => ({
    body,
    project,
    headers,
    cookies,
    header: jest.fn((key) => headers[key] || headers[key?.toLowerCase()] || null),
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
});

const makeRes = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
        cookie: jest.fn(),
        clearCookie: jest.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

describe('public userAuth refresh flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NODE_ENV = 'test';
    });

    test('login issues access token and sets refresh cookie', async () => {
        mockModel.findOne.mockResolvedValueOnce({
            _id: 'user_1',
            password: 'hashed_pw',
            email: 'a@b.com',
        });
        bcrypt.compare.mockResolvedValueOnce(true);

        const req = makeReq({
            body: { email: 'a@b.com', password: 'secret123' },
        });
        const res = makeRes();

        await controller.login(req, res);

        expect(res.cookie).toHaveBeenCalledWith(
            'refreshToken',
            expect.any(String),
            expect.objectContaining({ httpOnly: true })
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                token: 'signed_access_token',
                accessToken: 'signed_access_token',
                expiresIn: expect.any(String),
            })
        );
    });

    test('refresh-token returns 401 when token is missing', async () => {
        const req = makeReq({ headers: {} });
        const res = makeRes();

        await controller.refreshToken(req, res);

        expect(res.clearCookie).toHaveBeenCalledWith(
            'refreshToken',
            expect.objectContaining({ httpOnly: true })
        );
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('refresh-token rotates and returns new access token', async () => {
        const incoming = 'token_1.secret_1';
        const session = {
            tokenId: 'token_1',
            projectId: 'project_1',
            userId: 'user_1',
            tokenHash: hashToken(incoming),
            rotatedFrom: null,
            rotatedTo: null,
            isUsed: false,
            revokedAt: null,
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        };

        getRefreshSession.mockResolvedValueOnce(session); // getRefreshSession from common
        Project.__chain.lean.mockResolvedValueOnce(makeProject()); // load project
        mockModel.findOne.mockReturnValueOnce({
            lean: jest.fn().mockResolvedValue({ _id: 'user_1' }),
        }); // verify user

        const req = makeReq({
            headers: {
                'x-refresh-token': incoming,
                'x-refresh-token-mode': 'header',
            },
        });
        const res = makeRes();

        await controller.refreshToken(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                token: 'signed_access_token',
                accessToken: 'signed_access_token',
                refreshToken: expect.any(String),
            })
        );
    });

    test('logout revokes current refresh session when provided', async () => {
        const rawToken = 'token_2.secret_2';
        const session = {
            tokenId: 'token_2',
            projectId: 'project_1',
            userId: 'user_1',
            tokenHash: hashToken(rawToken),
            isUsed: false,
            revokedAt: null,
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
        };

        getRefreshSession.mockResolvedValueOnce(session);

        const req = makeReq({
            cookies: { refreshToken: rawToken },
        });
        const res = makeRes();

        await controller.logout(req, res);

        expect(res.clearCookie).toHaveBeenCalledWith(
            'refreshToken',
            expect.objectContaining({ httpOnly: true })
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('public profile returns only safe fields', async () => {
        mockModel.findOne.mockReturnValueOnce({
            lean: jest.fn().mockResolvedValue({
                _id: 'user_1',
                username: 'yash',
                name: 'Yash',
                bio: 'builder',
                email: 'private@example.com',
                password: 'hashed_secret',
                createdAt: '2026-01-01T00:00:00.000Z'
            })
        });

        const req = makeReq({
            project: {
                ...makeProject(),
                collections: [{
                    name: 'users',
                    model: [
                        { key: 'username' },
                        { key: 'name' },
                        { key: 'bio' },
                        { key: 'email' },
                        { key: 'password' }
                    ]
                }]
            },
            headers: {},
        });
        req.params = { username: 'yash' };

        const res = makeRes();
        await controller.publicProfile(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: 'user_1',
                username: 'yash',
                name: 'Yash',
                bio: 'builder',
            })
        );
        expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ email: 'private@example.com' }));
        expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ password: 'hashed_secret' }));
    });
});
