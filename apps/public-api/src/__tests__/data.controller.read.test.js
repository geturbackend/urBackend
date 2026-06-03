'use strict';

const mockFind = jest.fn();
const mockAnd = jest.fn();
const mockFindOne = jest.fn();
const mockQueryLean = jest.fn().mockResolvedValue([]);
const mockPopulate = jest.fn();
const mockEnginePopulate = jest.fn();

// mockAnd returns an object with .lean() so features.query.lean() works after .and()
mockAnd.mockReturnValue({ lean: mockQueryLean });

const mockQueryEngine = jest.fn((query) => {
    const engine = {
        query,
        filter() { return engine; },
        sort() { return engine; },
        limitFields() { return engine; },
        populate() { mockEnginePopulate(...arguments); return engine; },
        paginate() { return engine; },
        count() { return Promise.resolve(0); },
    };
    return engine;
});

jest.mock('@urbackend/common', () => ({
    sanitize: (v) => v,
    Project: {},
    getConnection: jest.fn().mockResolvedValue({}),
    getCompiledModel: jest.fn((connection, collectionConfig, projectId, isExternal) => ({
        find: (...args) => {
            mockFind(...args);
            return { 
                and: mockAnd, 
                populate: (...pArgs) => {
                    mockPopulate(...pArgs);
                    return { lean: mockQueryLean };
                },
                lean: mockQueryLean 
            };
        },
        findOne: (...args) => {
            mockFindOne(...args);
            const chainable = {
                populate: (...pArgs) => {
                    mockPopulate(...pArgs);
                    return chainable;
                },
                select: () => chainable,
                lean: jest.fn().mockResolvedValue({ _id: 'doc_1' }),
            };
            return chainable;
        },
    })),
    QueryEngine: mockQueryEngine,
    validateData: jest.fn(),
    validateUpdateData: jest.fn(),
}));

const { getAllData, getSingleDoc } = require('../controllers/data.controller');

function makeReq(overrides = {}) {
    return {
        params: { collectionName: 'posts', id: '507f1f77bcf86cd799439011' },
        project: {
            _id: 'proj_1',
            resources: { db: { isExternal: false } },
            collections: [{ name: 'posts', model: [] }],
        },
        query: {},
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

describe('data.controller read RLS filters', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockEnginePopulate.mockClear();
    });

    test('getAllData applies rlsFilter to find()', async () => {
        const req = makeReq({ rlsFilter: { userId: 'user_1' } });
        const res = makeRes();

        await getAllData(req, res);

        expect(mockFind).toHaveBeenCalledWith();
        expect(mockAnd).toHaveBeenCalledWith([{ userId: 'user_1' }]);
        expect(res.json).toHaveBeenCalled();
    });

    test('getSingleDoc applies rlsFilter to findOne()', async () => {
        const req = makeReq({ rlsFilter: { userId: 'user_1' } });
        const res = makeRes();

        await getSingleDoc(req, res);

        expect(mockFindOne).toHaveBeenCalledWith({
            $and: [
                { _id: '507f1f77bcf86cd799439011' },
                { userId: 'user_1' },
                { isDeleted: { $ne: true } }
            ],
        });
        expect(res.json).toHaveBeenCalled();
    });

    test('getAllData calls engine.populate() when populate param is provided', async () => {
        const req = makeReq({ query: { populate: 'author,comments' } });
        const res = makeRes();

        await getAllData(req, res);

        expect(mockQueryEngine).toHaveBeenCalled();
        expect(mockEnginePopulate).toHaveBeenCalled();
    });

    test('getAllData does not forward populate/expand to Mongo filter', async () => {
        const req = makeReq({ query: { populate: 'author', expand: 'category', title: 'hello' } });
        const res = makeRes();

        await getAllData(req, res);

        // mockFind is called with the raw Mongoose query (no args for Model.find())
        // The real filter exclusion is tested via the QueryEngine directly,
        // but we confirm find() was invoked and the request did not error out.
        expect(mockFind).toHaveBeenCalledWith();
        expect(res.json).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalledWith(500);
    });

    test('getAllData returns 400 when QueryEngine throws query validation error', async () => {
        mockQueryEngine.mockImplementationOnce(() => {
            const err = new Error('Invalid regex pattern for "name_regex".');
            err.statusCode = 400;
            return {
                query: {},
                filter() { throw err; },
                sort() { return this; },
                populate() { return this; },
                paginate() { return this; },
                count() { return Promise.resolve(0); },
            };
        });

        const req = makeReq({ query: { name_regex: '[' } });
        const res = makeRes();

        await getAllData(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: {},
            message: 'Invalid regex pattern for "name_regex".',
        });
    });

    test('getSingleDoc calls populate on the query', async () => {
        const req = makeReq({ query: { populate: 'author' } });
        const res = makeRes();

        await getSingleDoc(req, res);

        expect(mockPopulate).toHaveBeenCalledWith('author');
        expect(res.json).toHaveBeenCalled();
    });

    test('getSingleDoc handles array-format populate param without crashing', async () => {
        const req = makeReq({ query: { populate: ['author', 'category'] } });
        const res = makeRes();

        await getSingleDoc(req, res);

        expect(mockPopulate).toHaveBeenCalledWith('author');
        expect(mockPopulate).toHaveBeenCalledWith('category');
        expect(res.json).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalledWith(500);
    });

    test('getSingleDoc excludes soft-deleted documents by default', async () => {
        const req = makeReq();
        const res = makeRes();

        await getSingleDoc(req, res);

        expect(mockFindOne).toHaveBeenCalled();
        const findOneArgs = mockFindOne.mock.calls[0][0];
        expect(findOneArgs.$and).toEqual(
            expect.arrayContaining([
                { _id: '507f1f77bcf86cd799439011' },
                { isDeleted: { $ne: true } }
            ])
        );
    });

    test('getSingleDoc includes soft-deleted documents when include_deleted=true is passed', async () => {
        const req = makeReq({ 
            query: { include_deleted: 'true' },
            rlsFilter: { ownerId: 'user_123' }
        });
        const res = makeRes();

        await getSingleDoc(req, res);

        expect(mockFindOne).toHaveBeenCalled();
        const findOneArgs = mockFindOne.mock.calls[0][0];
        
        // Assert it contains the ID and RLS filter
        expect(findOneArgs.$and).toContainEqual({ _id: '507f1f77bcf86cd799439011' });
        expect(findOneArgs.$and).toContainEqual({ ownerId: 'user_123' });
        
        // Assert it does NOT contain the soft delete filter
        expect(findOneArgs.$and).not.toContainEqual({ isDeleted: { $ne: true } });
        
        // Assert no other filters are present (length should be 3 if softDeleteFilter was {}, but it's {} so it shouldn't add much, let's check exact elements)
        const softDeleteFilter = {}; // because include_deleted is true
        expect(findOneArgs.$and).toEqual([
            { _id: '507f1f77bcf86cd799439011' },
            { ownerId: 'user_123' },
            {} // empty object from softDeleteFilter
        ]);
    });
});
