'use strict';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

jest.mock('crypto', () => ({
    randomUUID: jest.fn(() => 'mocked-uuid'),
}));

jest.mock('@urbackend/common', () => {
    const mockStorageFrom = {
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
    };

    const mockSupabaseStorage = {
        from: jest.fn(() => mockStorageFrom),
    };

    return {
        getStorage: jest.fn(() => ({
            storage: mockSupabaseStorage,
        })),
        Project: {
            updateOne: jest.fn(),
        },
        isProjectStorageExternal: jest.fn(),
        __mockStorageFrom: mockStorageFrom, // expose for assertions
    };
});

// ---------------------------------------------------------------------------
// Import module under test after mocks
// ---------------------------------------------------------------------------

const { getStorage, Project, isProjectStorageExternal, __mockStorageFrom: mockStorageFrom } = require('@urbackend/common');
const storageController = require('../controllers/storage.controller');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRes = () => {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
};

const makeProject = (overrides = {}) => ({
    _id: 'project_id_1',
    name: 'TestProject',
    storageLimit: 100000000,
    storageUsed: 5000000,
    ...overrides,
});

const makeFile = (overrides = {}) => ({
    originalname: 'test file.txt',
    mimetype: 'text/plain',
    size: 1024,
    buffer: Buffer.from('test data'),
    ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('storage.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NODE_ENV = 'test';
    });

    describe('uploadFile', () => {
        test('returns 400 when no file is uploaded', async () => {
            const req = { project: makeProject(), file: null };
            const res = makeRes();

            await storageController.uploadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded.' });
        });

        test('returns 413 when file exceeds MAX_FILE_SIZE', async () => {
            const req = {
                project: makeProject(),
                file: makeFile({ size: 15 * 1024 * 1024 }) // 15MB
            };
            const res = makeRes();

            await storageController.uploadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(413);
            expect(res.json).toHaveBeenCalledWith({ error: 'File size exceeds limit.' });
        });

        test('returns 403 when internal storage quota is exceeded', async () => {
            isProjectStorageExternal.mockReturnValue(false);
            Project.updateOne.mockResolvedValue({ matchedCount: 0 }); // Simulates constraint failure

            const req = { project: makeProject(), file: makeFile() };
            const res = makeRes();

            await storageController.uploadFile(req, res);

            expect(Project.updateOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal storage limit exceeded.' });
        });

        test('returns 201 and public URL on successful internal upload', async () => {
            isProjectStorageExternal.mockReturnValue(false);
            Project.updateOne.mockResolvedValue({ matchedCount: 1 });
            mockStorageFrom.upload.mockResolvedValue({ data: { path: 'mocked-path' }, error: null });
            mockStorageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://mock.supabase.co/mocked-path' } });

            const req = { project: makeProject(), file: makeFile() };
            const res = makeRes();

            await storageController.uploadFile(req, res);

            expect(Project.updateOne).toHaveBeenCalledTimes(1); // Quota reservation
            expect(mockStorageFrom.upload).toHaveBeenCalledWith(
                'project_id_1/mocked-uuid_test_file.txt',
                req.file.buffer,
                { contentType: 'text/plain', upsert: false }
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'File uploaded successfully',
                url: 'https://mock.supabase.co/mocked-path',
                path: 'project_id_1/mocked-uuid_test_file.txt',
                provider: 'internal'
            });
        });

        test('returns 201 and public URL on successful external upload (skips quota)', async () => {
            isProjectStorageExternal.mockReturnValue(true);
            mockStorageFrom.upload.mockResolvedValue({ data: { path: 'mocked-path' }, error: null });
            mockStorageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://mock.supabase.co/mocked-path' } });

            const req = { project: makeProject(), file: makeFile() };
            const res = makeRes();

            await storageController.uploadFile(req, res);

            expect(Project.updateOne).not.toHaveBeenCalled(); // No quota reservation
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ provider: 'external' }));
        });

        test('rolls back quota and returns 500 when upload fails', async () => {
            isProjectStorageExternal.mockReturnValue(false);
            Project.updateOne.mockResolvedValue({ matchedCount: 1 });
            const error = new Error('Supabase Upload Failed');
            mockStorageFrom.upload.mockResolvedValue({ data: null, error });

            const req = { project: makeProject(), file: makeFile() };
            const res = makeRes();

            await storageController.uploadFile(req, res);

            expect(Project.updateOne).toHaveBeenCalledTimes(2); // One for reservation, one for rollback
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'File upload failed' }));
        });
    });

    describe('deleteFile', () => {
        test('returns 400 when file path is missing', async () => {
            const req = { project: makeProject(), body: {} };
            const res = makeRes();

            await storageController.deleteFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'File path is required.' });
        });

        test('returns 403 when trying to delete file belonging to different project', async () => {
            const req = { project: makeProject(), body: { path: 'wrong_project_id/file.txt' } };
            const res = makeRes();

            await storageController.deleteFile(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Access denied.' });
        });

        test('returns 403 when trying to delete file using path traversal', async () => {
            const req = { project: makeProject(), body: { path: 'project_id_1/../other_project/file.txt' } };
            const res = makeRes();

            await storageController.deleteFile(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Access denied.' });
        });

        test('returns 200 on successful internal deletion', async () => {
            isProjectStorageExternal.mockReturnValue(false);
            mockStorageFrom.list.mockResolvedValue({ data: [{ metadata: { size: 1024 } }], error: null });
            mockStorageFrom.remove.mockResolvedValue({ data: [{ path: 'project_id_1/file.txt' }], error: null });

            const req = { project: makeProject(), body: { path: 'project_id_1/file.txt' } };
            const res = makeRes();

            await storageController.deleteFile(req, res);

            expect(mockStorageFrom.list).toHaveBeenCalledWith('project_id_1', { search: 'file.txt', limit: 1 });
            expect(mockStorageFrom.remove).toHaveBeenCalledWith(['project_id_1/file.txt']);
            expect(Project.updateOne).toHaveBeenCalledWith(
                { _id: 'project_id_1' },
                { $inc: { storageUsed: -1024 } }
            );
            expect(res.json).toHaveBeenCalledWith({ message: 'File deleted successfully' });
        });

        test('returns 200 on successful external deletion and skips internal storageUsed update', async () => {
            isProjectStorageExternal.mockReturnValue(true);
            mockStorageFrom.list.mockResolvedValue({ data: [{ metadata: { size: 1024 } }], error: null });
            mockStorageFrom.remove.mockResolvedValue({ data: [{ path: 'project_id_1/file.txt' }], error: null });

            const req = { project: makeProject(), body: { path: 'project_id_1/file.txt' } };
            const res = makeRes();

            await storageController.deleteFile(req, res);

            expect(mockStorageFrom.list).toHaveBeenCalledWith('project_id_1', { search: 'file.txt', limit: 1 });
            expect(Project.updateOne).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: 'File deleted successfully' });
        });

        test('falls back to zero fileSize when Supabase list fails', async () => {
            isProjectStorageExternal.mockReturnValue(false);
            mockStorageFrom.list.mockResolvedValue({ data: null, error: new Error('List failed') });
            mockStorageFrom.remove.mockResolvedValue({ data: [{ path: 'project_id_1/file.txt' }], error: null });

            const req = { project: makeProject(), body: { path: 'project_id_1/file.txt' } };
            const res = makeRes();

            await storageController.deleteFile(req, res);

            expect(Project.updateOne).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: 'File deleted successfully' });
        });

        test('returns 500 when Supabase remove fails', async () => {
            isProjectStorageExternal.mockReturnValue(false);
            mockStorageFrom.list.mockResolvedValue({ data: [{ metadata: { size: 1024 } }], error: null });
            mockStorageFrom.remove.mockResolvedValue({ data: null, error: new Error('Remove failed') });

            const req = { project: makeProject(), body: { path: 'project_id_1/file.txt' } };
            const res = makeRes();

            await storageController.deleteFile(req, res);

            expect(Project.updateOne).not.toHaveBeenCalled(); // Storage used shouldn't decrement
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteAllFiles', () => {
        test('returns 404 when project is not found', async () => {
            const req = { project: null };
            const res = makeRes();

            await storageController.deleteAllFiles(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Project not found' });
        });

        test('deletes paginated files and resets internal storage to 0', async () => {
            isProjectStorageExternal.mockReturnValue(false);
            
            // first call returns 2 items, second call returns []
            mockStorageFrom.list
                .mockResolvedValueOnce({ data: [{ name: 'file1.txt' }, { name: 'file2.txt' }], error: null })
                .mockResolvedValueOnce({ data: [], error: null });
                
            mockStorageFrom.remove.mockResolvedValue({ data: [{ path: 'project_id_1/file1.txt' }], error: null });

            const req = { project: makeProject() };
            const res = makeRes();

            await storageController.deleteAllFiles(req, res);

            expect(mockStorageFrom.remove).toHaveBeenCalledWith(['project_id_1/file1.txt', 'project_id_1/file2.txt']);
            expect(Project.updateOne).toHaveBeenCalledWith(
                { _id: 'project_id_1' },
                { $set: { storageUsed: 0 } }
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                deleted: 2,
                provider: 'internal'
            });
        });

        test('skips storageUsed reset for external provider during deleteAllFiles', async () => {
            isProjectStorageExternal.mockReturnValue(true);

            mockStorageFrom.list
                .mockResolvedValueOnce({ data: [{ name: 'file1.txt' }], error: null })
                .mockResolvedValueOnce({ data: [], error: null });

            mockStorageFrom.remove.mockResolvedValue({ data: [{}], error: null });

            const req = { project: makeProject() };
            const res = makeRes();

            await storageController.deleteAllFiles(req, res);

            expect(Project.updateOne).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ provider: 'external' }));
        });

        test('returns 500 when Supabase remove fails during deleteAllFiles', async () => {
            isProjectStorageExternal.mockReturnValue(false);
            mockStorageFrom.list.mockResolvedValue({ data: [{ name: 'file1.txt' }], error: null });
            mockStorageFrom.remove.mockResolvedValue({ data: null, error: new Error('Remove failed') });

            const req = { project: makeProject() };
            const res = makeRes();

            await storageController.deleteAllFiles(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to delete files' }));
        });

        test('returns 500 if pagination fetch fails', async () => {
            isProjectStorageExternal.mockReturnValue(false);
            mockStorageFrom.list.mockResolvedValue({ data: null, error: new Error('Pagination error') });

            const req = { project: makeProject() };
            const res = makeRes();

            await storageController.deleteAllFiles(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to delete files' }));
        });
    });
});
