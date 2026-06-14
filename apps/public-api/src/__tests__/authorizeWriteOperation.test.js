'use strict';

// ---------------------------------------------------------------------------
// Mock heavy dependencies before requiring the module under test.
// ---------------------------------------------------------------------------

const mockFindById = jest.fn();
const mockSelect = jest.fn();
const mockLean = jest.fn();

jest.mock('@urbackend/common', () => {
    class MockAppError extends Error {
        constructor(statusCode, message, error) {
            super(message);
            this.statusCode = statusCode;
            this.error = error;
            this.isOperational = true;
        }
    }
    return {
        AppError: MockAppError,
        getConnection: jest.fn().mockResolvedValue({}),
        getCompiledModel: jest.fn().mockReturnValue({
            findById: (...args) => {
                mockFindById(...args);
                return {
                    select: (field) => {
                        mockSelect(field);
                        return { lean: mockLean };
                    },
                };
            },
        }),
    };
});

jest.mock('mongoose', () => ({
    Types: {
        ObjectId: {
            isValid: jest.fn((id) => /^[a-f\d]{24}$/i.test(id)),
        },
    },
}));

const authorizeWriteOperation = require('../middlewares/authorizeWriteOperation');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_OID = '507f1f77bcf86cd799439011';

function makeProject(rlsOverrides = {}) {
    return {
        _id: 'proj_1',
        resources: { db: { isExternal: false } },
        collections: [
            {
                name: 'posts',
                model: [{ key: 'userId' }, { key: 'title' }],
                rls: {
                    enabled: true,
                    mode: 'owner-write-only',
                    ownerField: 'userId',
                    requireAuthForWrite: true,
                    ...rlsOverrides,
                },
            },
        ],
    };
}

function makeReq(overrides = {}) {
    return {
        keyRole: 'publishable',
        params: { collectionName: 'posts', id: undefined },
        project: makeProject(),
        authUser: null,
        body: {},
        method: 'POST',
        ...overrides,
    };
}

function makeRes() {
    const res = {
        statusCode: null,
        body: null,
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    res.status.mockImplementation((code) => {
        res.statusCode = code;
        return res;
    });
    res.json.mockImplementation((data) => {
        res.body = data;
        return res;
    });
    return res;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('authorizeWriteOperation middleware', () => {
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        next = jest.fn();
    });

    // -------------------------------------------------------------------------
    // sk_live write => allowed (bypass)
    // -------------------------------------------------------------------------
    describe('secret key bypass', () => {
        test('sk_live: allows write without any token or RLS config', async () => {
            const req = makeReq({ keyRole: 'secret' });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------------------
    // pk_live write without token => blocked
    // -------------------------------------------------------------------------
    describe('pk_live write without token', () => {
        test('blocked with 403 when RLS is disabled on the collection', async () => {
            const req = makeReq({
                project: {
                    ...makeProject({ enabled: false }),
                    collections: [
                        {
                            name: 'posts',
                            model: [],
                            rls: { enabled: false },
                        },
                    ],
                },
                authUser: null,
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, error: 'Write blocked for publishable key' }));
            expect(res.status).not.toHaveBeenCalled();
        });

        test('blocked with 401 when RLS enabled but no auth token provided', async () => {
            const req = makeReq({ authUser: null });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------------------
    // pk_live write with token + owner mismatch => blocked
    // -------------------------------------------------------------------------
    describe('pk_live write with token + owner mismatch', () => {
        test('POST: blocked with 403 when ownerField value does not match auth userId', async () => {
            const req = makeReq({
                method: 'POST',
                authUser: { userId: 'user_abc' },
                body: { title: 'My Post', userId: 'user_xyz' }, // mismatch
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, error: 'RLS owner mismatch' }));
            expect(res.status).not.toHaveBeenCalled();
        });

        // In the new atomic design, the middleware does not block based on document owner
        // Instead, it sets req.rlsFilter and lets the controller handle the ownership filter atomically.
    });

    // -------------------------------------------------------------------------
    // pk_live write with token + owner match => allowed
    // -------------------------------------------------------------------------
    describe('pk_live write with token + owner match', () => {
        test('POST: allowed when ownerField value matches auth userId', async () => {
            const req = makeReq({
                method: 'POST',
                authUser: { userId: 'user_abc' },
                body: { title: 'My Post', userId: 'user_abc' }, // match
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        test('PUT: injects rlsFilter and calls next', async () => {
            const req = makeReq({
                method: 'PUT',
                params: { collectionName: 'posts', id: VALID_OID },
                authUser: { userId: 'user_abc' },
                body: { title: 'Updated' },
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(req.rlsFilter).toEqual({ userId: 'user_abc' });
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        test('DELETE: injects rlsFilter and calls next', async () => {
            const req = makeReq({
                method: 'DELETE',
                params: { collectionName: 'posts', id: VALID_OID },
                authUser: { userId: 'user_abc' },
                body: {},
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(req.rlsFilter).toEqual({ userId: 'user_abc' });
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------------------
    // pk_live write with missing owner (auto-inject) => allowed
    // -------------------------------------------------------------------------
    describe('pk_live write with missing ownerField (auto-inject)', () => {
        test('POST: auto-injects userId when ownerField is absent from body', async () => {
            const req = makeReq({
                method: 'POST',
                authUser: { userId: 'user_abc' },
                body: { title: 'My Post' }, // userId not provided
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(req.body.userId).toBe('user_abc');
            expect(res.status).not.toHaveBeenCalled();
        });

        test('POST: auto-injects userId when ownerField is null in body', async () => {
            const req = makeReq({
                method: 'POST',
                authUser: { userId: 'user_abc' },
                body: { title: 'My Post', userId: null },
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(req.body.userId).toBe('user_abc');
        });

        test('POST: auto-injects userId when ownerField is empty string in body', async () => {
            const req = makeReq({
                method: 'POST',
                authUser: { userId: 'user_abc' },
                body: { title: 'My Post', userId: '' },
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(req.body.userId).toBe('user_abc');
        });
    });

    // -------------------------------------------------------------------------
    // Edge cases
    // -------------------------------------------------------------------------
    describe('edge cases', () => {
        test('returns 404 when collection is not found in project', async () => {
            const req = makeReq({
                params: { collectionName: 'nonexistent', id: undefined },
                authUser: { userId: 'user_abc' },
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, error: 'Collection not found' }));
            expect(res.status).not.toHaveBeenCalled();
        });

        test('returns 403 when RLS ownerField is _id for a POST insert', async () => {
            const req = makeReq({
                method: 'POST',
                project: {
                    _id: 'proj_1',
                    resources: { db: { isExternal: false } },
                    collections: [
                        {
                            name: 'posts',
                            model: [],
                            rls: {
                                enabled: true,
                                mode: 'owner-write-only',
                                ownerField: '_id',
                                requireAuthForWrite: true,
                            },
                        },
                    ],
                },
                authUser: { userId: 'user_abc' },
                body: { title: 'My Post' },
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, error: 'Insert denied' }));
            expect(res.status).not.toHaveBeenCalled();
        });

        test('returns 400 for an invalid document id on PUT', async () => {
            const req = makeReq({
                method: 'PUT',
                params: { collectionName: 'posts', id: 'bad-id' },
                authUser: { userId: 'user_abc' },
                body: { title: 'Updated' },
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, error: 'Invalid ID format' }));
            expect(res.status).not.toHaveBeenCalled();
        });



        test('blocks attempt to change ownerField value on PATCH', async () => {
            const req = makeReq({
                method: 'PATCH',
                params: { collectionName: 'posts', id: VALID_OID },
                authUser: { userId: 'user_abc' },
                body: { userId: 'user_xyz' }, // attempt to change owner
            });
            const res = makeRes();

            await authorizeWriteOperation(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, error: 'Owner field immutable' }));
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
