'use strict';

class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

const mockAppError = AppError;

jest.mock('@urbackend/common', () => ({
    AppError: mockAppError,
    Project: {
        findOne: jest.fn()
    },
    getProjectAccessQuery: jest.fn((userId) => ({ $or: [{ owner: userId }, { "members.user": userId }] }))
}));

jest.mock('mongoose', () => ({
    Types: {
        ObjectId: {
            isValid: jest.fn((value) => value === '507f1f77bcf86cd799439011')
        }
    }
}));

const { Project } = require('@urbackend/common');
const loadProjectForAdmin = require('../middlewares/loadProjectForAdmin');


describe('loadProjectForAdmin Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: {},
            user: { _id: 'user123' }
        };
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should call next with AppError(400) if projectId is missing', async () => {
        await loadProjectForAdmin(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe("Project ID is required");
        expect(Project.findOne).not.toHaveBeenCalled();
    });

    it('should call next with AppError(400) if projectId is invalid', async () => {
        req.params.projectId = 'bad-id';

        await loadProjectForAdmin(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe("Invalid project ID format");
        expect(Project.findOne).not.toHaveBeenCalled();
    });

    it('should call next with AppError(404) if project is not found', async () => {
        req.params.projectId = '507f1f77bcf86cd799439011';
        Project.findOne.mockResolvedValueOnce(null);

        await loadProjectForAdmin(req, res, next);

        expect(Project.findOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011', $or: [{ owner: 'user123' }, { "members.user": 'user123' }] });
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe("Project not found or access denied");
    });

    it('should set req.project and call next without error if project is found', async () => {
        req.params.projectId = '507f1f77bcf86cd799439011';
        const mockProject = { _id: '507f1f77bcf86cd799439011', name: 'Test Project' };
        Project.findOne.mockResolvedValueOnce(mockProject);

        await loadProjectForAdmin(req, res, next);

        expect(Project.findOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011', $or: [{ owner: 'user123' }, { "members.user": 'user123' }] });
        expect(req.project).toEqual(mockProject);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });
});
