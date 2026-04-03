'use strict';

const mongoose = require('mongoose');

// Mock @urbackend/common first to mock Project and cache utilities
const mockProjectSave = jest.fn();
const mockProjectFindOne = jest.fn();

jest.mock('@urbackend/common', () => ({
    Project: { 
        findOne: mockProjectFindOne 
    },
    deleteProjectById: jest.fn().mockResolvedValue(true)
}));

const { updateNotificationSettings } = require('../controllers/project.controller');

describe('project.controller - updateNotificationSettings', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            params: { projectId: '60c72b2f9b1d8b001c8e4b52' },
            user: { _id: 'ownerId123' },
            body: {}
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    test('should return 400 if email payload is missing', async () => {
        mockReq.body = {}; // no 'email' property
        await updateNotificationSettings(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Missing 'email' settings in body" });
    });

    test('should return 404 if project is not found or not owned by user', async () => {
        mockReq.body = { email: { enabled: true } };
        mockProjectFindOne.mockResolvedValueOnce(null);

        await updateNotificationSettings(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ error: "Project not found or access denied." });
    });

    test('should successfully update notification settings and save the project', async () => {
        const incomingEmailSettings = {
            enabled: true,
            storage: { type: 'absolute', absoluteLimit: 1000 },
            database: { type: 'percentage', thresholds: [50, 75] }
        };

        mockReq.body = { email: incomingEmailSettings };

        const mockProjectDoc = {
            _id: '60c72b2f9b1d8b001c8e4b52',
            notificationSettings: {
                email: {
                    enabled: false
                }
            },
            markModified: jest.fn(),
            save: mockProjectSave
        };

        mockProjectFindOne.mockResolvedValueOnce(mockProjectDoc);
        mockProjectSave.mockResolvedValueOnce(mockProjectDoc);

        await updateNotificationSettings(mockReq, mockRes);

        // Expect the object to be updated with merged settings
        expect(mockProjectDoc.notificationSettings.email).toMatchObject(incomingEmailSettings);
        
        // Since we provided storage/database, markModified should be called
        expect(mockProjectDoc.markModified).toHaveBeenCalledWith('notificationSettings');
        expect(mockProjectSave).toHaveBeenCalled();

        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            settings: mockProjectDoc.notificationSettings
        });
    });

    test('should handle validation errors or save failures gracefully', async () => {
        mockReq.body = { email: { enabled: true } };
        
        mockProjectFindOne.mockRejectedValueOnce(new Error('DB Connection Failed'));

        await updateNotificationSettings(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'DB Connection Failed' });
    });
});
