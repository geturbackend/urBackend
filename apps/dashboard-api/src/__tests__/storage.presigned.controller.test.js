'use strict';

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomUUID: jest.fn(() => 'mocked-uuid'),
  };
});

jest.mock('@urbackend/common', () => {
  class AppError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    }
  }

  const mockStorageFrom = {
    getPublicUrl: jest.fn(),
    remove: jest.fn(),
  };

  const mockSupabaseStorage = {
    from: jest.fn(() => mockStorageFrom),
  };

  return {
    Project: {
      findOne: jest.fn(),
      updateOne: jest.fn(),
    },
    getStorage: jest.fn(() => ({
      storage: mockSupabaseStorage,
    })),
    getPresignedUploadUrl: jest.fn(),
    verifyUploadedFile: jest.fn(),
    isProjectStorageExternal: jest.fn(),
    getBucket: jest.fn(() => 'dev-files'),
    sanitizeObjectId: jest.fn((value) => {
      if (typeof value !== 'string') return null;
      const normalized = value.trim();
      return /^[a-fA-F0-9]{24}$/.test(normalized) ? normalized : null;
    }),
    sanitizeNonEmptyString: jest.fn((value, options = {}) => {
      if (typeof value !== 'string') return null;
      const normalized = value.trim();
      if (!normalized) return null;
      if (normalized.length > (options.maxLength || 1024)) return null;
      return normalized;
    }),
    AppError,
    getProjectAccessQuery: jest.fn((userId) => ({ owner: userId })),
    __mockStorageFrom: mockStorageFrom,
  };
});

const {
  Project,
  getPresignedUploadUrl,
  verifyUploadedFile,
  isProjectStorageExternal,
  __mockStorageFrom: mockStorageFrom,
} = require('@urbackend/common');

const controller = require('../controllers/project.controller');
const PROJECT_ID = '507f1f77bcf86cd799439011';

const makeRes = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const makeNext = () => jest.fn();

const makeProject = (overrides = {}) => ({
  _id: PROJECT_ID,
  owner: 'dev1',
  storageUsed: 100,
  storageLimit: 1024 * 1024,
  resources: { storage: { isExternal: false } },
  ...overrides,
});

const mockFindOneSelect = (project) => {
  Project.findOne.mockReturnValue({
    select: jest.fn().mockResolvedValue(project),
  });
};

describe('dashboard project.controller presigned upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('requestUpload', () => {
    test('returns 400 for invalid input', async () => {
      const req = {
        params: { projectId: PROJECT_ID },
        body: { filename: 'a.txt', contentType: 'text/plain', size: 'abc' },
        user: { _id: 'dev1' },
      };
      const res = makeRes();
      const next = makeNext();

      await controller.requestUpload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: 'projectId, filename, contentType, and size are required.',
      }));
    });

    test('returns 403 when internal quota is exceeded', async () => {
      mockFindOneSelect(makeProject({ storageUsed: 900, storageLimit: 1000 }));
      isProjectStorageExternal.mockReturnValue(false);

      const req = {
        params: { projectId: PROJECT_ID },
        body: { filename: 'a.txt', contentType: 'text/plain', size: 200 },
        user: { _id: 'dev1' },
      };
      const res = makeRes();
      const next = makeNext();

      await controller.requestUpload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: 'Internal storage limit exceeded.',
      }));
    });

    test('returns signed URL payload on success', async () => {
      mockFindOneSelect(makeProject());
      isProjectStorageExternal.mockReturnValue(false);
      getPresignedUploadUrl.mockResolvedValue({
        signedUrl: 'https://signed.example/upload',
        token: 't1',
      });

      const req = {
        params: { projectId: PROJECT_ID },
        body: { filename: 'my file.txt', contentType: 'text/plain', size: 1234 },
        user: { _id: 'dev1' },
      };
      const res = makeRes();
      const next = makeNext();

      await controller.requestUpload(req, res, next);

      expect(getPresignedUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({ _id: PROJECT_ID }),
        `${PROJECT_ID}/mocked-uuid_my_file.txt`,
        'text/plain',
        1234,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          signedUrl: 'https://signed.example/upload',
          token: 't1',
          filePath: `${PROJECT_ID}/mocked-uuid_my_file.txt`,
        },
        message: 'Upload URL generated successfully.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('confirmUpload', () => {
    test('returns 403 when project path does not match', async () => {
      mockFindOneSelect(makeProject());
      isProjectStorageExternal.mockReturnValue(false);

      const req = {
        params: { projectId: PROJECT_ID },
        body: { filePath: '507f1f77bcf86cd799439012/file.txt', size: 200 },
        user: { _id: 'dev1' },
      };
      const res = makeRes();
      const next = makeNext();

      await controller.confirmUpload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: 'Access denied.',
      }));
    });

    test('returns 409 when uploaded file is not visible yet', async () => {
      mockFindOneSelect(makeProject());
      isProjectStorageExternal.mockReturnValue(false);
      verifyUploadedFile.mockRejectedValue(new Error('File not found after upload'));
      mockStorageFrom.remove.mockResolvedValue({ data: null, error: null });

      const req = {
        params: { projectId: PROJECT_ID },
        body: { filePath: `${PROJECT_ID}/file.txt`, size: 200 },
        user: { _id: 'dev1' },
      };
      const res = makeRes();
      const next = makeNext();

      await controller.confirmUpload(req, res, next);

      expect(mockStorageFrom.remove).toHaveBeenCalledWith([`${PROJECT_ID}/file.txt`]);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 409,
        message: 'Uploaded file is not visible yet. Please retry confirmation.',
      }));
    });

    test('returns 400 when declared size mismatches actual size', async () => {
      mockFindOneSelect(makeProject());
      isProjectStorageExternal.mockReturnValue(false);
      verifyUploadedFile.mockResolvedValue(1024);
      mockStorageFrom.remove.mockResolvedValue({ data: null, error: null });

      const req = {
        params: { projectId: PROJECT_ID },
        body: { filePath: `${PROJECT_ID}/file.txt`, size: 900 },
        user: { _id: 'dev1' },
      };
      const res = makeRes();
      const next = makeNext();

      await controller.confirmUpload(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: 'Declared file size does not match uploaded file size.',
      }));
      expect(mockStorageFrom.remove).toHaveBeenCalledWith([`${PROJECT_ID}/file.txt`]);
    });

    test('charges quota and returns success on internal storage', async () => {
      mockFindOneSelect(makeProject());
      isProjectStorageExternal.mockReturnValue(false);
      verifyUploadedFile.mockResolvedValue(1024);
      Project.updateOne.mockResolvedValue({ matchedCount: 1 });
      mockStorageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example/p/project1/file.txt' } });

      const req = {
        params: { projectId: PROJECT_ID },
        body: { filePath: `${PROJECT_ID}/file.txt`, size: 1024 },
        user: { _id: 'dev1' },
      };
      const res = makeRes();
      const next = makeNext();

      await controller.confirmUpload(req, res, next);

      expect(Project.updateOne).toHaveBeenCalledWith(
        {
          _id: PROJECT_ID,
          $or: [
            { storageLimit: -1 },
            { $expr: { $lte: [{ $add: ['$storageUsed', 1024] }, '$storageLimit'] } },
          ],
        },
        { $inc: { storageUsed: 1024 } },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Upload confirmed',
          path: `${PROJECT_ID}/file.txt`,
          provider: 'internal',
          url: 'https://cdn.example/p/project1/file.txt',
        },
        message: 'Upload confirmed.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('skips quota charge for external storage', async () => {
      mockFindOneSelect(makeProject({ resources: { storage: { isExternal: true } } }));
      isProjectStorageExternal.mockReturnValue(true);
      verifyUploadedFile.mockResolvedValue(512);
      mockStorageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: null } });

      const req = {
        params: { projectId: PROJECT_ID },
        body: { filePath: `${PROJECT_ID}/file.txt`, size: 512 },
        user: { _id: 'dev1' },
      };
      const res = makeRes();
      const next = makeNext();

      await controller.confirmUpload(req, res, next);

      expect(Project.updateOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Upload confirmed',
          path: `${PROJECT_ID}/file.txt`,
          provider: 'external',
          url: null,
          warning: 'Upload confirmed, but a public URL is unavailable.',
        },
        message: 'Upload confirmed.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
