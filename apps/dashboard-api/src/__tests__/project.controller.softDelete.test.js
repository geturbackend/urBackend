'use strict';

const mockFindOneAndUpdate = jest.fn();
const mockFindOne = jest.fn();

const mockModel = {
    findOneAndUpdate: mockFindOneAndUpdate,
};

const mockWebhookQueueAdd = jest.fn();

jest.mock('@urbackend/common', () => ({
    Project: {
        findOne: mockFindOne,
    },
    getConnection: jest.fn().mockResolvedValue({}),
    getCompiledModel: jest.fn(() => mockModel),
    webhookQueue: { add: mockWebhookQueueAdd },
    enqueueCollectionCleanup: jest.fn().mockResolvedValue(true),
    syncCollectionCleanup: jest.fn().mockResolvedValue(true),
    AppError: class AppError extends Error {
        constructor(statusCode, message) {
            super(message);
            this.statusCode = statusCode;
            this.isOperational = true;
        }
    },
    getProjectAccessQuery: jest.fn((userId) => ({ $or: [{ owner: userId }, { "members.user": userId }] }))
}));

const { deleteRow, recoverRow } = require('../controllers/project.controller');
const mongoose = require('mongoose');

function makeReq() {
    return {
        params: { projectId: 'proj_1', collectionName: 'posts', id: '507f1f77bcf86cd799439011' },
        user: { _id: 'user_1' }
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

describe('Soft Delete in dashboard project.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('deleteRow sets isDeleted: true instead of hard deleting', async () => {
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();

        // Mock project
        const project = {
            _id: 'proj_1',
            resources: { db: { isExternal: false } },
            collections: [{ name: 'posts', model: [] }],
            save: jest.fn().mockResolvedValue(true)
        };
        mockFindOne.mockResolvedValue(project);

        // Mock document
        const doc = { _id: '507f1f77bcf86cd799439011', isDeleted: false };
        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(doc)
        });

        await deleteRow(req, res, next);

        expect(mockFindOne).toHaveBeenCalled();
        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
            { _id: '507f1f77bcf86cd799439011', isDeleted: { $ne: true } },
            expect.objectContaining({
                $set: expect.objectContaining({ isDeleted: true, deletedAt: expect.any(Date) })
            }),
            { new: false }
        );
        
        expect(res.json).toHaveBeenCalledWith({ 
            success: true, 
            data: { id: '507f1f77bcf86cd799439011' }, 
            message: "Document moved to trash" 
        });
    });

    test('deleteRow returns 404 via next(AppError) if document is already soft-deleted or not found', async () => {
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();

        // Mock project
        const project = {
            _id: 'proj_1',
            resources: { db: { isExternal: false } },
            collections: [{ name: 'posts', model: [] }],
            save: jest.fn().mockResolvedValue(true)
        };
        mockFindOne.mockResolvedValue(project);

        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
        });

        await deleteRow(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 404,
            message: "Document not found."
        }));
    });

    test('recoverRow restores a soft-deleted document', async () => {
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();

        // Mock project
        const project = {
            _id: 'proj_1',
            resources: { db: { isExternal: false } },
            collections: [{ name: 'posts', model: [] }]
        };
        
        // recoverRow uses Project.findOne({ _id: projectId, owner: req.user._id }).lean()
        const mockProjectFind = {
            lean: jest.fn().mockResolvedValue(project)
        };
        mockFindOne.mockReturnValue(mockProjectFind);

        // Mock document
        const restoredDoc = { _id: '507f1f77bcf86cd799439011', isDeleted: false, deletedAt: null };
        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(restoredDoc)
        });

        await recoverRow(req, res, next);

        expect(mockFindOne).toHaveBeenCalledWith({ 
            _id: 'proj_1', 
            $or: [
                { owner: 'user_1' },
                { 'members.user': 'user_1' }
            ]
        });
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

        expect(mockWebhookQueueAdd).toHaveBeenCalledWith(
            'trigger-webhook',
            expect.objectContaining({
                event: 'document.recovered',
                payload: restoredDoc,
                projectId: 'proj_1',
                collection: 'posts'
            }),
            { removeOnComplete: true }
        );
        const { syncCollectionCleanup } = require('@urbackend/common');
        expect(syncCollectionCleanup).toHaveBeenCalledWith('proj_1', 'posts');
    });

    test('recoverRow returns 404 via next(AppError) if document is not in trash', async () => {
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();

        // Mock project
        const project = {
            _id: 'proj_1',
            resources: { db: { isExternal: false } },
            collections: [{ name: 'posts', model: [] }]
        };
        const mockProjectFind = {
            lean: jest.fn().mockResolvedValue(project)
        };
        mockFindOne.mockReturnValue(mockProjectFind);

        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
        });

        await recoverRow(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 404,
            message: "Document not found or recovery window expired (30 days)."
        }));
    });

    test('recoverRow returns 409 via next(AppError) if document restoration causes a unique field conflict', async () => {
        const req = makeReq();
        const res = makeRes();
        const next = jest.fn();

        const project = {
            _id: 'proj_1',
            resources: { db: { isExternal: false } },
            collections: [{ name: 'posts', model: [] }]
        };
        mockFindOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(project)
        });

        const error = new Error('Duplicate key');
        error.code = 11000;
        mockFindOneAndUpdate.mockReturnValue({
            lean: jest.fn().mockRejectedValue(error)
        });

        await recoverRow(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 409,
            message: expect.stringContaining("unique field value conflicts")
        }));
    });

    test('recoverRow returns 400 via next(AppError) if document ID is invalid', async () => {
        const req = {
            params: { projectId: 'proj_1', collectionName: 'posts', id: 'invalid-id' },
            user: { _id: 'user_1' }
        };
        const res = makeRes();
        const next = jest.fn();

        await recoverRow(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 400,
            message: "Invalid document ID format."
        }));
    });
});
