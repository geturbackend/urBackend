'use strict';

const mockFindOne = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockPopulate = jest.fn().mockReturnThis();
const mockLean = jest.fn();

jest.mock('@urbackend/common', () => ({
    Project: {
        findOne: jest.fn(() => ({
            select: mockSelect,
            populate: mockPopulate,
            lean: mockLean,
        })),
    },
    hashApiKey: jest.fn((key) => `hashed_${key}`),
    getProjectByApiKeyCache: jest.fn().mockResolvedValue(null),
    setProjectByApiKeyCache: jest.fn().mockResolvedValue(undefined),
}));

const { hashApiKey, getProjectByApiKeyCache, Project } = require('@urbackend/common');
const verifyApiKey = require('../middlewares/verifyApiKey');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProject(overrides = {}) {
    return {
        _id: 'proj_1',
        owner: { isVerified: true },
        resources: { db: { isExternal: false }, storage: { isExternal: false } },
        allowedDomains: ['*'],
        ...overrides,
    };
}

function makeReq({ headers = {}, query = {} } = {}) {
    return {
        header: jest.fn((name) => headers[name.toLowerCase()] || undefined),
        headers,
        query: { ...query },
    };
}

function makeRes() {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    return res;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('verifyApiKey middleware', () => {
    const next = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        getProjectByApiKeyCache.mockResolvedValue(null);
        mockLean.mockResolvedValue(makeProject());
    });

    test('accepts publishable key via x-api-key header', async () => {
        const req = makeReq({ headers: { 'x-api-key': 'pk_live_headerkey' } });
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.keyRole).toBe('publishable');
    });

    test('accepts publishable key via ?key= query param', async () => {
        const req = makeReq({ query: { key: 'pk_live_querykey' } });
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.keyRole).toBe('publishable');
    });

    test('strips ?key= from req.query after reading it', async () => {
        const req = makeReq({ query: { key: 'pk_live_querykey', other: 'keep' } });
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(req.query.key).toBeUndefined();
        expect(req.query.other).toBe('keep');
    });

    test('rejects secret key supplied via ?key= query param', async () => {
        const req = makeReq({ query: { key: 'sk_live_secretkey' } });
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'API key not found' }));
    });

    test('header takes precedence when both x-api-key header and ?key= query param are present', async () => {
        const req = makeReq({
            headers: { 'x-api-key': 'pk_live_headerkey' },
            query: { key: 'pk_live_querykey' },
        });
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(next).toHaveBeenCalled();
        // hashApiKey is called with the header key, not the query key
        expect(hashApiKey).toHaveBeenCalledWith('pk_live_headerkey');
        expect(hashApiKey).not.toHaveBeenCalledWith('pk_live_querykey');
    });

    test('?key= is stripped even when it is not a valid pk_live_ key', async () => {
        const req = makeReq({
            headers: { 'x-api-key': 'pk_live_headerkey' },
            query: { key: 'sk_live_secretkey' },
        });
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(req.query.key).toBeUndefined();
        expect(next).toHaveBeenCalled();
    });

    test('returns 401 when no key is provided at all', async () => {
        const req = makeReq();
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'API key not found' }));
    });

    test('returns 401 when project is not found in DB', async () => {
        mockLean.mockResolvedValueOnce(null);
        const req = makeReq({ query: { key: 'pk_live_unknown' } });
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'API key is expired or invalid.' }));
    });

    test('returns 401 when owner is not verified', async () => {
        getProjectByApiKeyCache.mockResolvedValueOnce(makeProject({ owner: { isVerified: false } }));
        const req = makeReq({ query: { key: 'pk_live_unverifiedowner' } });
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Owner not verified' }));
    });

    test('uses cache when available and does not query DB', async () => {
        getProjectByApiKeyCache.mockResolvedValueOnce(makeProject());
        const req = makeReq({ query: { key: 'pk_live_cached' } });
        const res = makeRes();

        await verifyApiKey(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(Project.findOne).not.toHaveBeenCalled();
    });
});
