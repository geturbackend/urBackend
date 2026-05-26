'use strict';

const mockFindOneAndUpdate = jest.fn();
const mockFindOne = jest.fn();
const mockLean = jest.fn();

const mockModel = {
    findOneAndUpdate: mockFindOneAndUpdate,
    findOne: mockFindOne,
};

const mongoose = require("mongoose");

jest.mock('@urbackend/common', () => {
    const mongoose = require("mongoose");
    return {
        sanitize: (v) => v,
        Project: {},
        getConnection: jest.fn().mockResolvedValue({}),
        getCompiledModel: jest.fn(() => mockModel),
        dispatchWebhooks: jest.fn(),
        QueryEngine: jest.fn(),
        validateData: jest.fn(),
        validateUpdateData: jest.fn(),
        isValidId: (id) => mongoose.Types.ObjectId.isValid(id),
        enqueueCollectionCleanup: jest.fn().mockResolvedValue(true),
        syncCollectionCleanup: jest.fn().mockResolvedValue(true),
        AppError: class AppError extends Error {
            constructor(statusCode, message) {
                super(message);
                this.statusCode = statusCode;
            }
        }
    };
});

const { deleteSingleDoc, recoverSingleDoc } = require('../controllers/data.controller');

function makeReq(overrides = {}) {
    return {
        params: { collectionName: 'posts', id: '507f1f77bcf86cd799439011' },
        project: {
            _id: 'proj_1',
            resources: { db: { isExternal: false } },
            collections: [{ name: 'posts', model: [] }],
        },
        query: {},
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
    return res;
}

describe('Soft Delete in data.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('deleteSingleDoc sets isDeleted: true instead of hard deleting', async () => {
        const req = makeReq();
        const res = makeRes();
        const before = Date.now();

        const doc = { _id: '507f1f77bcf86cd799439011', isDeleted: false };
        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(doc)
        });

        await deleteSingleDoc(req, res);

        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ _id: '507f1f77bcf86cd799439011', isDeleted: { $ne: true } }),
            expect.objectContaining({
                $set: expect.objectContaining({ isDeleted: true, deletedAt: expect.any(Date) })
            }),
            { new: false }
        );

        const deletedAt = mockFindOneAndUpdate.mock.calls[0][1].$set.deletedAt;
        expect(deletedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
        expect(deletedAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
        
        expect(res.json).toHaveBeenCalledWith({ 
            success: true, 
            data: { id: '507f1f77bcf86cd799439011' }, 
            message: "Document moved to trash" 
        });
    });

    test('deleteSingleDoc returns 404 if document is already soft-deleted or not found', async () => {
        const req = makeReq();
        const res = makeRes();

        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
        });

        await deleteSingleDoc(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Document not found.' });
    });

    test('recoverSingleDoc restores a soft-deleted document', async () => {
        const req = makeReq();
        const res = makeRes();

        const restoredDoc = { _id: '507f1f77bcf86cd799439011', isDeleted: false, deletedAt: null };
        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(restoredDoc)
        });

        await recoverSingleDoc(req, res);

        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ 
                _id: '507f1f77bcf86cd799439011', 
                isDeleted: true,
                deletedAt: expect.objectContaining({ $gte: expect.any(Date) })
            }),
            expect.objectContaining({
                $set: { isDeleted: false, deletedAt: null }
            }),
            { new: true }
        );

        expect(res.json).toHaveBeenCalledWith({ 
            success: true, 
            data: restoredDoc, 
            message: "Document recovered from trash" 
        });

        const { dispatchWebhooks, syncCollectionCleanup } = require('@urbackend/common');
        expect(dispatchWebhooks).toHaveBeenCalledWith(expect.objectContaining({
            action: 'recover',
            document: restoredDoc,
            projectId: 'proj_1'
        }));
        expect(syncCollectionCleanup).toHaveBeenCalledWith('proj_1', 'posts');
    });

    test('recoverSingleDoc returns 404 if document is not in trash', async () => {
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();

        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
        });

        await recoverSingleDoc(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 404,
            message: "Document not found or recovery window expired (30 days)."
        }));
    });

    test('recoverSingleDoc returns 409 if document restoration causes a unique field conflict', async () => {
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();

        const error = new Error('Duplicate key');
        error.code = 11000;
        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockRejectedValue(error)
        });

        await recoverSingleDoc(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 409,
            message: expect.stringContaining("unique field value conflicts")
        }));
    });

    test('recoverSingleDoc returns 400 if ID is invalid', async () => {
        const req = makeReq({ params: { collectionName: 'posts', id: 'invalid-id' } });
        const res = makeRes();
        const next = jest.fn();

        await recoverSingleDoc(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 400,
            message: "Invalid document ID format."
        }));
    });
});
