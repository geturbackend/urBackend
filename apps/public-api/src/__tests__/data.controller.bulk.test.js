'use strict';

const mockInsertMany = jest.fn();
const mockUpdateOne = jest.fn();
const mockDispatchWebhooks = jest.fn();

jest.mock('@urbackend/common', () => ({
    sanitize: (v) => v,
    Project: {
        updateOne: (...args) => mockUpdateOne(...args),
        findOneAndUpdate: jest.fn().mockImplementation((query, update) => {
            // Simple mock to simulate success if databaseLimit > databaseUsed + increment
            const inc = update.$inc.databaseUsed;
            return {
                lean: () => ({ databaseUsed: inc })
            };
        })
    },
    getConnection: jest.fn().mockResolvedValue({}),
    getCompiledModel: jest.fn(() => ({
        insertMany: mockInsertMany,
    })),
    validateData: jest.fn(),
    QueryEngine: jest.fn(),
}));

jest.mock('../utils/webhookDispatcher', () => ({
    dispatchWebhooks: mockDispatchWebhooks,
}));

const { insertBulkData } = require('../controllers/data.controller');
const { validateData } = require('@urbackend/common');

function makeReq(overrides = {}) {
    return {
        params: { collectionName: 'posts' },
        project: {
            _id: 'proj_1',
            databaseLimit: 1000000,
            databaseUsed: 0,
            resources: { db: { isExternal: false } },
            collections: [{ name: 'posts', model: [{ key: 'title', type: 'String' }] }],
        },
        body: [],
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

describe('data.controller bulk inserts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 400 if payload is not an array', async () => {
        const req = makeReq({ body: { title: 'Not an array' } });
        const res = makeRes();

        await insertBulkData(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/array/);
    });

    test('returns 400 if payload array is empty', async () => {
        const req = makeReq({ body: [] });
        const res = makeRes();

        await insertBulkData(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/empty/);
    });

    test('returns 201 on full success', async () => {
        const req = makeReq({ body: [{ title: 'Post 1' }, { title: 'Post 2' }] });
        const res = makeRes();

        // All items valid
        validateData.mockReturnValue({ cleanData: { title: 'Clean Post' } });
        mockInsertMany.mockResolvedValue([
            { _id: 'doc1', title: 'Clean Post', toObject: () => ({ _id: 'doc1', title: 'Clean Post' }) },
            { _id: 'doc2', title: 'Clean Post', toObject: () => ({ _id: 'doc2', title: 'Clean Post' }) }
        ]);

        await insertBulkData(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.insertedCount).toBe(2);
        expect(res.body.data.errors).toEqual([]);
        expect(mockInsertMany).toHaveBeenCalledTimes(1);
        expect(mockDispatchWebhooks).toHaveBeenCalledTimes(2);
    });

    test('returns 207 when some items fail schema validation', async () => {
        const req = makeReq({ body: [{ title: 'Valid' }, { title: 123 }] });
        const res = makeRes();

        // 1st passes, 2nd fails
        validateData
            .mockReturnValueOnce({ cleanData: { title: 'Valid' } })
            .mockReturnValueOnce({ error: 'title must be string' });
        
        mockInsertMany.mockResolvedValue([
            { _id: 'doc1', title: 'Valid', toObject: () => ({ _id: 'doc1', title: 'Valid' }) }
        ]);

        await insertBulkData(req, res);

        expect(res.status).toHaveBeenCalledWith(207);
        expect(res.body.success).toBe(false);
        expect(res.body.data.insertedCount).toBe(1);
        expect(res.body.data.errors.length).toBe(1);
        expect(res.body.data.errors[0].index).toBe(1);
        
        expect(mockInsertMany).toHaveBeenCalledWith([ { title: 'Valid' } ], { ordered: false });
        expect(mockDispatchWebhooks).toHaveBeenCalledTimes(1);
    });

    test('returns 400 when ALL documents fail schema validation', async () => {
        const req = makeReq({ body: [{ title: 123 }, { title: 456 }] });
        const res = makeRes();

        validateData.mockReturnValue({ error: 'title must be string' });

        await insertBulkData(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.body.success).toBe(false);
        expect(res.body.data.errors.length).toBe(2);
        expect(mockInsertMany).not.toHaveBeenCalled();
    });

    test('returns 403 on database limit exceeded', async () => {
        const req = makeReq({ body: [{ title: 'Valid' }] });
        const res = makeRes();

        // Mock database limit strictly tightly
        req.project.databaseLimit = 1;

        validateData.mockReturnValue({ cleanData: { title: 'Valid' } });

        const { Project } = require('@urbackend/common');
        Project.findOneAndUpdate.mockReturnValueOnce({
            lean: () => null
        });

        await insertBulkData(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.body.message).toMatch(/Database limit exceeded/);
        expect(mockInsertMany).not.toHaveBeenCalled();
    });

    test('handles MongoBulkWriteError properly and returns 207', async () => {
        const req = makeReq({ body: [{ title: 'Valid 1' }, { title: 'Duplicate' }, { title: 'Valid 2' }] });
        const res = makeRes();

        validateData.mockReturnValue({ cleanData: { title: 'Mock' } });
        
        // Simulating the shape of a Mongoose BulkWriteError
        const error = new Error('E11000 duplicate key error');
        error.name = 'MongoBulkWriteError';
        error.code = 11000;
        error.insertedDocs = [
            { _id: 'doc1', title: 'Mock', toObject: () => ({ _id: 'doc1', title: 'Mock' }) },
            { _id: 'doc3', title: 'Mock', toObject: () => ({ _id: 'doc3', title: 'Mock' }) }
        ];
        error.writeErrors = [
            { index: 1, errmsg: 'Duplicate key error on index 1' }
        ];
        
        mockInsertMany.mockRejectedValue(error);

        await insertBulkData(req, res);

        expect(res.status).toHaveBeenCalledWith(207);
        expect(res.body.success).toBe(false);
        expect(res.body.data.insertedCount).toBe(2);
        expect(res.body.data.errors.length).toBe(1);
        // Ensure index matches original array
        expect(res.body.data.errors[0].index).toBe(1);
        expect(mockUpdateOne).toHaveBeenCalled();
        expect(mockDispatchWebhooks).toHaveBeenCalledTimes(2);
    });
});
