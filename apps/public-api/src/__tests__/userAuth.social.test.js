'use strict';

const crypto = require('crypto');

jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed-social-password'),
    compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'signed_access_token'),
    verify: jest.fn(),
}));

jest.mock('mongoose', () => ({
    Types: {
        ObjectId: jest.fn((id) => id),
    },
}));

jest.mock('../utils/refreshToken', () => ({
    assertRefreshRateLimits: jest.fn(),
    clearRefreshCookie: jest.fn(),
    hashRefreshToken: jest.fn(),
    issueAuthTokens: jest.fn().mockResolvedValue({
        accessToken: 'issued_access_token',
        refreshToken: 'issued_refresh_token',
        expiresIn: '15m',
        tokenId: 'token_1',
    }),
    parseRefreshToken: jest.fn(),
    readRefreshTokenFromRequest: jest.fn(),
    shouldExposeRefreshToken: jest.fn(() => false),
}));

const mockProjectFindByIdChain = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn(),
};

const mockUsersModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
};

jest.mock('@urbackend/common', () => {
    const z = require('zod');
    return {
        redis: {
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn(),
            del: jest.fn().mockResolvedValue(1),
        },
        Project: {
            findById: jest.fn(() => mockProjectFindByIdChain),
        },
        authEmailQueue: { add: jest.fn() },
        getRefreshSession: jest.fn(),
        persistRefreshSession: jest.fn(),
        revokeSessionChain: jest.fn(),
        loginSchema: z.object({ email: z.string().email(), password: z.string().min(1) }),
        userSignupSchema: z.object({ email: z.string().email(), password: z.string().min(6) }).passthrough(),
        resetPasswordSchema: z.object({ email: z.string().email(), otp: z.string(), newPassword: z.string().min(6) }),
        onlyEmailSchema: z.object({ email: z.string().email() }),
        verifyOtpSchema: z.object({ email: z.string().email(), otp: z.string() }),
        changePasswordSchema: z.object({ currentPassword: z.string(), newPassword: z.string().min(6) }),
        sanitize: jest.fn((value) => value),
        getConnection: jest.fn().mockResolvedValue({}),
        getCompiledModel: jest.fn(() => mockUsersModel),
        decrypt: jest.fn((encrypted) => {
            if (!encrypted?.encrypted) return null;
            if (encrypted.encrypted === 'github') return 'github_secret';
            if (encrypted.encrypted === 'google') return 'google_secret';
            return null;
        }),
    };
});

const { redis } = require('@urbackend/common');
const { issueAuthTokens } = require('../utils/refreshToken');
const controller = require('../controllers/userAuth.controller');

const { privateKey: googlePrivateKey, publicKey: googlePublicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
});
const GOOGLE_PRIVATE_KEY_PEM = googlePrivateKey.export({ format: 'pem', type: 'pkcs8' });
const GOOGLE_JWK = {
    ...googlePublicKey.export({ format: 'jwk' }),
    kid: 'google-kid-1',
    alg: 'RS256',
    use: 'sig',
};

const makeProject = () => ({
    _id: 'project_1',
    name: 'Demo',
    jwtSecret: 'jwt_secret',
    isAuthEnabled: true,
    resources: { db: { isExternal: false } },
    collections: [
        {
            name: 'users',
            model: [
                { key: 'email', type: 'String', required: true },
                { key: 'password', type: 'String', required: true },
                { key: 'username', type: 'String', required: false },
            ],
        },
    ],
    authProviders: {
        github: {
            enabled: true,
            clientId: 'github_client_id',
            clientSecret: { encrypted: 'github', iv: 'y', tag: 'z' },
            redirectUri: 'http://localhost:1235/api/userAuth/social/github/callback',
        },
        google: {
            enabled: true,
            clientId: 'google_client_id',
            clientSecret: { encrypted: 'google', iv: 'y', tag: 'z' },
            redirectUri: 'http://localhost:1235/api/userAuth/social/google/callback',
        },
    },
});

const makeReq = ({ params = {}, query = {}, project = makeProject() } = {}) => ({
    params,
    query,
    body: {},
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
        redirect: jest.fn(),
        cookie: jest.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
};

const base64UrlEncode = (input) => Buffer.from(input).toString('base64url');

const signGoogleIdToken = (claims = {}) => {
    const header = {
        alg: 'RS256',
        kid: GOOGLE_JWK.kid,
        typ: 'JWT',
    };
    const payload = {
        iss: 'https://accounts.google.com',
        aud: 'google_client_id',
        sub: 'google-user-1',
        email: 'alice@example.com',
        email_verified: true,
        name: 'Alice Example',
        picture: 'https://example.com/avatar.png',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        ...claims,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${encodedHeader}.${encodedPayload}`);
    signer.end();
    const signature = signer.sign(GOOGLE_PRIVATE_KEY_PEM).toString('base64url');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
};

describe('public userAuth social auth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
        process.env.FRONTEND_URL = 'http://localhost:5173';
        mockProjectFindByIdChain.select.mockReturnValue(mockProjectFindByIdChain);
    });

    test('startSocialAuth redirects to GitHub authorize URL', async () => {
        mockProjectFindByIdChain.lean.mockResolvedValueOnce(makeProject());
        const req = makeReq({ params: { provider: 'github' } });
        const res = makeRes();

        await controller.startSocialAuth(req, res);

        expect(redis.set).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('https://github.com/login/oauth/authorize?'));
    });

    test('startSocialAuth redirects to Google authorize URL', async () => {
        mockProjectFindByIdChain.lean.mockResolvedValueOnce(makeProject());
        const req = makeReq({ params: { provider: 'google' } });
        const res = makeRes();

        await controller.startSocialAuth(req, res);

        expect(redis.set).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('https://accounts.google.com/o/oauth2/v2/auth?'));
    });

    test('handleSocialAuthCallback rejects invalid state', async () => {
        redis.get.mockResolvedValueOnce(null);
        const req = makeReq({ params: { provider: 'github' }, query: { code: 'code_1', state: 'missing' } });
        const res = makeRes();

        await controller.handleSocialAuthCallback(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid or expired OAuth state' }));
    });

    test('handleSocialAuthCallback rejects when GitHub returns no email', async () => {
        redis.get.mockResolvedValueOnce(JSON.stringify({ projectId: 'project_1', provider: 'github' }));
        mockProjectFindByIdChain.lean.mockResolvedValueOnce(makeProject());
        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'github_access_token' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 123, login: 'alice', avatar_url: '' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ([]),
            });

        const req = makeReq({ params: { provider: 'github' }, query: { code: 'code_1', state: 'state_1' } });
        const res = makeRes();

        await controller.handleSocialAuthCallback(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('did not return an email address'),
        }));
    });

    test('handleSocialAuthCallback redirects after GitHub signup', async () => {
        redis.get.mockResolvedValueOnce(JSON.stringify({ projectId: 'project_1', provider: 'github' }));
        mockProjectFindByIdChain.lean.mockResolvedValueOnce(makeProject());
        mockUsersModel.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockUsersModel.create.mockResolvedValueOnce({ _id: 'user_new_1' });

        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'github_access_token' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 123, login: 'alice', name: 'Alice' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ([{ email: 'alice@example.com', primary: true, verified: true }]),
            });

        const req = makeReq({ params: { provider: 'github' }, query: { code: 'code_1', state: 'state_1' } });
        const res = makeRes();

        await controller.handleSocialAuthCallback(req, res);

        expect(mockUsersModel.create).toHaveBeenCalledWith(expect.objectContaining({
            email: 'alice@example.com',
            githubId: '123',
            authProviders: ['github'],
        }));
        expect(issueAuthTokens).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/callback?'));
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('token=issued_access_token'));
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('rtCode='));
        expect(res.redirect).not.toHaveBeenCalledWith(expect.stringContaining('refreshToken=issued_refresh_token'));
    });

    test('handleSocialAuthCallback links existing email GitHub user and redirects', async () => {
        redis.get.mockResolvedValueOnce(JSON.stringify({ projectId: 'project_1', provider: 'github' }));
        mockProjectFindByIdChain.lean.mockResolvedValueOnce(makeProject());
        mockUsersModel.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ _id: 'user_existing_1', email: 'alice@example.com' })
            .mockResolvedValueOnce({ _id: 'user_existing_1', email: 'alice@example.com', githubId: '123' });

        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'github_access_token' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 123, login: 'alice', name: 'Alice' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ([{ email: 'alice@example.com', primary: true, verified: true }]),
            });

        const req = makeReq({ params: { provider: 'github' }, query: { code: 'code_1', state: 'state_1' } });
        const res = makeRes();

        await controller.handleSocialAuthCallback(req, res);

        expect(mockUsersModel.updateOne).toHaveBeenCalledWith(
            { _id: 'user_existing_1' },
            expect.objectContaining({
                $set: expect.objectContaining({ githubId: '123' }),
                $addToSet: { authProviders: 'github' },
            })
        );
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('linkedByEmail=true'));
    });

    test('handleSocialAuthCallback redirects after Google signup', async () => {
        redis.get.mockResolvedValueOnce(JSON.stringify({ projectId: 'project_1', provider: 'google' }));
        mockProjectFindByIdChain.lean.mockResolvedValueOnce(makeProject());
        mockUsersModel.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockUsersModel.create.mockResolvedValueOnce({ _id: 'user_google_1' });

        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id_token: signGoogleIdToken() }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ keys: [GOOGLE_JWK] }),
            });

        const req = makeReq({ params: { provider: 'google' }, query: { code: 'code_google', state: 'state_google' } });
        const res = makeRes();

        await controller.handleSocialAuthCallback(req, res);

        expect(mockUsersModel.create).toHaveBeenCalledWith(expect.objectContaining({
            email: 'alice@example.com',
            googleId: 'google-user-1',
            authProviders: ['google'],
        }));
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('provider=google'));
    });

    test('handleSocialAuthCallback links existing email Google user and redirects', async () => {
        redis.get.mockResolvedValueOnce(JSON.stringify({ projectId: 'project_1', provider: 'google' }));
        mockProjectFindByIdChain.lean.mockResolvedValueOnce(makeProject());
        mockUsersModel.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ _id: 'user_existing_google', email: 'alice@example.com' })
            .mockResolvedValueOnce({ _id: 'user_existing_google', email: 'alice@example.com', googleId: 'google-user-1' });

        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id_token: signGoogleIdToken() }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ keys: [GOOGLE_JWK] }),
            });

        const req = makeReq({ params: { provider: 'google' }, query: { code: 'code_google', state: 'state_google' } });
        const res = makeRes();

        await controller.handleSocialAuthCallback(req, res);

        expect(mockUsersModel.updateOne).toHaveBeenCalledWith(
            { _id: 'user_existing_google' },
            expect.objectContaining({
                $set: expect.objectContaining({ googleId: 'google-user-1' }),
                $addToSet: { authProviders: 'google' },
            })
        );
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('provider=google'));
    });

    test('handleSocialAuthCallback rejects when Google returns no email', async () => {
        redis.get.mockResolvedValueOnce(JSON.stringify({ projectId: 'project_1', provider: 'google' }));
        mockProjectFindByIdChain.lean.mockResolvedValueOnce(makeProject());

        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id_token: signGoogleIdToken({ email: '', email_verified: false }) }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ keys: [GOOGLE_JWK] }),
            });

        const req = makeReq({ params: { provider: 'google' }, query: { code: 'code_google', state: 'state_google' } });
        const res = makeRes();

        await controller.handleSocialAuthCallback(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('did not return an email address'),
        }));
    });

    test('handleSocialAuthCallback rejects invalid Google id_token audience', async () => {
        redis.get.mockResolvedValueOnce(JSON.stringify({ projectId: 'project_1', provider: 'google' }));
        mockProjectFindByIdChain.lean.mockResolvedValueOnce(makeProject());

        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id_token: signGoogleIdToken({ aud: 'wrong_audience' }) }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ keys: [GOOGLE_JWK] }),
            });

        const req = makeReq({ params: { provider: 'google' }, query: { code: 'code_google', state: 'state_google' } });
        const res = makeRes();

        await controller.handleSocialAuthCallback(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Google id_token audience mismatch',
        }));
    });

    test('exchangeSocialRefreshToken returns refresh token and deletes exchange code', async () => {
        redis.get.mockResolvedValueOnce(JSON.stringify({
            token: 'issued_access_token',
            refreshToken: 'issued_refresh_token',
        }));

        const req = makeReq();
        req.body = {
            rtCode: 'code_123',
            token: 'issued_access_token',
        };
        const res = makeRes();

        await controller.exchangeSocialRefreshToken(req, res);

        expect(redis.get).toHaveBeenCalledWith('project:social-auth:refresh-exchange:code_123');
        expect(redis.del).toHaveBeenCalledWith('project:social-auth:refresh-exchange:code_123');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                refreshToken: 'issued_refresh_token',
            },
            message: 'Refresh token exchanged successfully',
        });
    });

    test('exchangeSocialRefreshToken rejects invalid or expired code', async () => {
        redis.get.mockResolvedValueOnce(null);

        const req = makeReq();
        req.body = {
            rtCode: 'missing_code',
            token: 'issued_access_token',
        };
        const res = makeRes();

        await controller.exchangeSocialRefreshToken(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid or expired refresh token exchange code',
        });
    });

    test('exchangeSocialRefreshToken rejects mismatched token and deletes exchange code', async () => {
        redis.get.mockResolvedValueOnce(JSON.stringify({
            token: 'expected_access_token',
            refreshToken: 'issued_refresh_token',
        }));

        const req = makeReq();
        req.body = {
            rtCode: 'code_456',
            token: 'wrong_access_token',
        };
        const res = makeRes();

        await controller.exchangeSocialRefreshToken(req, res);

        expect(redis.del).toHaveBeenCalledWith('project:social-auth:refresh-exchange:code_456');
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid refresh token exchange payload',
        });
    });
});
