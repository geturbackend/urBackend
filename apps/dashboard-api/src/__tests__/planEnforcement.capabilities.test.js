jest.mock('@urbackend/common', () => {
  class AppError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
    }
  }

  const Project = {
    countDocuments: jest.fn(),
    findOne: jest.fn(),
  };

  return {
    AppError,
    Project,
    sanitizeObjectId: jest.fn((value) => value || null),
    resolveEffectivePlan: jest.fn(() => 'free'),
    getPlanLimits: jest.fn(() => ({ maxProjects: 1, maxCollections: 5 })),
  };
});

const { Project, AppError } = require('@urbackend/common');
const { checkDeveloperCapability, checkProjectLimit, checkCollectionLimit } = require('../middlewares/planEnforcement');

const makeReq = (overrides = {}) => ({
  user: { _id: 'dev_1', email: 'dev@example.com', isVerified: false },
  developer: { _id: 'dev_1', isVerified: false },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

describe('planEnforcement capability checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ADMIN_EMAIL;
  });

  test('allows an unverified developer to create their first project', async () => {
    Project.countDocuments.mockResolvedValue(0);
    const req = makeReq();
    const next = jest.fn();

    await checkDeveloperCapability('createProject')(req, {}, next);

    expect(Project.countDocuments).toHaveBeenCalledWith({ owner: 'dev_1' });
    expect(req.projectLimit).toBe(1);
    expect(next).toHaveBeenCalledWith();
  });

  test('skips plan project limit for unverified developers so sandbox capability owns it', async () => {
    const req = makeReq();
    const next = jest.fn();

    await checkProjectLimit(req, {}, next);

    expect(req.projectLimit).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  test('blocks additional projects for unverified developers', async () => {
    Project.countDocuments.mockResolvedValue(1);
    const next = jest.fn();

    await checkDeveloperCapability('createProject')(makeReq(), {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(next.mock.calls[0][0].message).toContain('Verify your email');
  });

  test('allows unverified developers to create up to three collections', async () => {
    Project.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ collections: [{ name: 'posts' }, { name: 'comments' }] }),
    });
    const req = makeReq({ body: { projectId: 'project_1' } });
    const next = jest.fn();

    await checkDeveloperCapability('createCollection')(req, {}, next);

    expect(req.collectionLimit).toBe(3);
    expect(next).toHaveBeenCalledWith();
  });

  test('skips plan collection limit for unverified developers so sandbox capability owns it', async () => {
    const req = makeReq({ body: { projectId: 'project_1' } });
    const next = jest.fn();

    await checkCollectionLimit(req, {}, next);

    expect(req.collectionLimit).toBeUndefined();
    expect(Project.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  test('blocks collection creation beyond the unverified sandbox limit', async () => {
    Project.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        collections: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
      }),
    });
    const next = jest.fn();

    await checkDeveloperCapability('createCollection')(makeReq({ body: { projectId: 'project_1' } }), {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  test('blocks key reveal for unverified developers', async () => {
    const next = jest.fn();

    await checkDeveloperCapability('revealApiKeys')(makeReq(), {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  test('allows verified developers to use protected capabilities', async () => {
    const next = jest.fn();
    const req = makeReq({
      user: { _id: 'dev_1', email: 'dev@example.com', isVerified: true },
      developer: { _id: 'dev_1', isVerified: true },
    });

    await checkDeveloperCapability('revealApiKeys')(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
