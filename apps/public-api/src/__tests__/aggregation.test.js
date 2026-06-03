'use strict';

const mockAggregate = jest.fn();

jest.mock('@urbackend/common', () => ({
    sanitize: (v) => v,
    Project: {},
    getConnection: jest.fn().mockResolvedValue({}),
    getCompiledModel: jest.fn(() => ({
        aggregate: mockAggregate,
    })),
    QueryEngine: jest.fn(),
    validateData: jest.fn(),
    validateUpdateData: jest.fn(),
    aggregateSchema: require('../../../../packages/common/src/utils/input.validation').aggregateSchema,
}));

const { aggregateData } = require('../controllers/data.controller');

function makeReq(overrides = {}) {
    return {
        params: { collectionName: 'posts' },
        project: {
            _id: 'proj_1',
            resources: { db: { isExternal: false } },
            collections: [{ name: 'posts', model: [] }],
        },
        body: { pipeline: [{ $group: { _id: '$status', count: { $sum: 1 } } }] },
        rlsFilter: {},
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

describe('aggregateData controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAggregate.mockResolvedValue([{ _id: 'published', count: 2 }]);
    });

    test('executes a valid aggregation pipeline', async () => {
        const req = makeReq({ query: {} });
        const res = makeRes();

        await aggregateData(req, res);

        expect(mockAggregate).toHaveBeenCalledWith([
            { $match: { isDeleted: { $ne: true } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            success: true,
            data: [{ _id: 'published', count: 2 }],
            message: 'Aggregation executed successfully.',
        });
    });

    test('prepends the RLS match stage when req.rlsFilter is set', async () => {
        const req = makeReq({
            query: {},
            rlsFilter: { userId: 'user_1' },
            body: {
                pipeline: [
                    { $match: { status: 'published' } },
                    { $sort: { createdAt: -1 } },
                ],
            },
        });
        const res = makeRes();

        await aggregateData(req, res);

        expect(mockAggregate).toHaveBeenCalledWith([
            { $match: { userId: 'user_1', isDeleted: { $ne: true } } },
            { $match: { status: 'published' } },
            { $sort: { createdAt: -1 } },
        ]);
        expect(res.statusCode).toBe(200);
    });

    test('includes soft-deleted documents when include_deleted=true is passed', async () => {
        const req = makeReq({
            query: { include_deleted: 'true' },
            body: { pipeline: [{ $group: { _id: '$status', count: { $sum: 1 } } }] },
        });
        const res = makeRes();

        await aggregateData(req, res);

        expect(mockAggregate).toHaveBeenCalledWith([
            { $match: {} }, // softDeleteFilter should be empty
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        expect(res.statusCode).toBe(200);
    });

    test('blocks write-capable aggregation stages', async () => {
        const req = makeReq({
            body: { pipeline: [{ $match: { status: 'published' } }, { $out: 'archive' }] },
        });
        const res = makeRes();

        await aggregateData(req, res);

        expect(mockAggregate).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            success: false,
            data: {},
            message: 'Aggregation pipeline contains blocked stage.',
        });
    });

    test('rejects invalid pipeline payloads', async () => {
        const req = makeReq({
            body: { pipeline: { $group: { _id: '$status' } } },
        });
        const res = makeRes();

        await aggregateData(req, res);

        expect(mockAggregate).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            success: false,
            data: {},
            message: 'Invalid input: expected array, received object',
        });
    });
});
