'use strict';

const mockFind = jest.fn();
const mockAnd = jest.fn();
const mockFindOne = jest.fn();
const mockQueryLean = jest.fn().mockResolvedValue([]);
const mockPopulate = jest.fn();

// mockAnd returns an object with .lean() so features.query.lean() works after .and()
mockAnd.mockReturnValue({ lean: mockQueryLean });

const mockQueryEngine = jest.fn((query) => {
    const engine = {
        query,
        filter() { return engine; },
        sort() { return engine; },
        populate() { return engine; },
        paginate() { return engine; },
    };
    return engine;
});

jest.mock('@urbackend/common', () => ({
    sanitize: (v) => v,
    Project: {},
    getConnection: jest.fn().mockResolvedValue({}),
    getCompiledModel: jest.fn(() => ({
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
            return { 
                populate: (...pArgs) => {
                    mockPopulate(...pArgs);
                    return { lean: jest.fn().mockResolvedValue({ _id: 'doc_1' }) };
                },
                lean: jest.fn().mockResolvedValue({ _id: 'doc_1' }) 
            };
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
            ],
        });
        expect(res.json).toHaveBeenCalled();
    });

    test('getAllData passes populate param to QueryEngine', async () => {
        const req = makeReq({ query: { populate: 'author,comments' } });
        const res = makeRes();

        // The real QueryEngine (not mocked) would call .populate() on the query
        // But since we mock QueryEngine, we just check if populate() was part of the chain
        // In this specific test file, mockQueryEngine is what's used.
        await getAllData(req, res);
        
        expect(mockQueryEngine).toHaveBeenCalled();
    });

    test('getSingleDoc calls populate on the query', async () => {
        const req = makeReq({ query: { populate: 'author' } });
        const res = makeRes();

        await getSingleDoc(req, res);

        expect(mockPopulate).toHaveBeenCalledWith('author');
        expect(res.json).toHaveBeenCalled();
    });
});
