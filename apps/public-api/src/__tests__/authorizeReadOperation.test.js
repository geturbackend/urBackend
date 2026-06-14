'use strict';

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
        AppError: MockAppError
    };
});

const authorizeReadOperation = require('../middlewares/authorizeReadOperation');
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProject(rlsOverrides = {}) {
    return {
        _id: 'proj_1',
        collections: [
            {
                name: 'posts',
                rls: {
                    enabled: true,
                    mode: 'public-read',
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
        params: { collectionName: 'posts' },
        project: makeProject(),
        authUser: null,
        rlsFilter: undefined,
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

describe('authorizeReadOperation middleware', () => {
    let next;

    beforeEach(() => {
        next = jest.fn();
    });

    test('secret key bypass sets empty filter', async () => {
        const req = makeReq({ keyRole: 'secret' });
        const res = makeRes();

        await authorizeReadOperation(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.rlsFilter).toEqual({});
    });

    test('returns 404 when collection is not found', async () => {
        const req = makeReq({ params: { collectionName: 'unknown' } });
        const res = makeRes();

        await authorizeReadOperation(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Collection not found' }));
        expect(res.status).not.toHaveBeenCalled();
    });

    test('rls disabled allows public read', async () => {
        const req = makeReq({ project: makeProject({ enabled: false }) });
        const res = makeRes();

        await authorizeReadOperation(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.rlsFilter).toEqual({});
    });

    test('public-read allows read without auth', async () => {
        const req = makeReq({ authUser: null });
        const res = makeRes();

        await authorizeReadOperation(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.rlsFilter).toEqual({});
    });

    test('owner-write-only is treated as public-read', async () => {
        const req = makeReq({ project: makeProject({ mode: 'owner-write-only' }) });
        const res = makeRes();

        await authorizeReadOperation(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.rlsFilter).toEqual({});
    });

    test('private mode requires auth', async () => {
        const req = makeReq({ project: makeProject({ mode: 'private' }) });
        const res = makeRes();

        await authorizeReadOperation(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'Provide a valid user Bearer token for private reads.' }));
        expect(res.status).not.toHaveBeenCalled();
    });

    test('private mode sets owner filter when authed', async () => {
        const req = makeReq({
            project: makeProject({ mode: 'private', ownerField: 'userId' }),
            authUser: { userId: 'user_abc' },
        });
        const res = makeRes();

        await authorizeReadOperation(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.rlsFilter).toEqual({ userId: 'user_abc' });
    });
});
