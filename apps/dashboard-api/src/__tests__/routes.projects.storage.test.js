'use strict';

jest.mock('../middlewares/authMiddleware', () =>
  jest.fn((req, _res, next) => {
    req.user = { _id: 'dev1' };
    next();
  }),
);

jest.mock('../middlewares/planEnforcement', () => ({
  attachDeveloper: jest.fn((_req, _res, next) => next()),
  checkProjectLimit: jest.fn((_req, _res, next) => next()),
  checkCollectionLimit: jest.fn((_req, _res, next) => next()),
  checkByokGate: jest.fn((_req, _res, next) => next()),
  checkByodGate: jest.fn((_req, _res, next) => next()),
  checkWebhookGate: jest.fn((_req, _res, next) => next()),
  checkMailTemplatesGate: jest.fn((_req, _res, next) => next()),
}));

jest.mock('@urbackend/common', () => ({
  verifyEmail: jest.fn((_req, _res, next) => next()),
  checkAuthEnabled: jest.fn((_req, _res, next) => next()),
  loadProjectForAdmin: jest.fn((_req, _res, next) => next()),
}));

jest.mock('../controllers/userAuth.controller', () => ({
  createAdminUser: jest.fn((_req, res) => res.json({ ok: true })),
  resetPassword: jest.fn((_req, res) => res.json({ ok: true })),
  getUserDetails: jest.fn((_req, res) => res.json({ ok: true })),
  updateAdminUser: jest.fn((_req, res) => res.json({ ok: true })),
  listUserSessions: jest.fn((_req, res) => res.json({ ok: true })),
  revokeUserSession: jest.fn((_req, res) => res.json({ ok: true })),
}));

jest.mock('../controllers/project.controller', () => {
  const ok = (_req, res) => res.json({ ok: true });
  return {
    createProject: jest.fn(ok),
    getAllProject: jest.fn(ok),
    getSingleProject: jest.fn(ok),
    regenerateApiKey: jest.fn(ok),
    createCollection: jest.fn(ok),
    deleteCollection: jest.fn(ok),
    getData: jest.fn(ok),
    deleteRow: jest.fn(ok),
    insertData: jest.fn(ok),
    editRow: jest.fn(ok),
    listFiles: jest.fn(ok),
    deleteFile: jest.fn(ok),
    deleteAllFiles: jest.fn(ok),
    deleteProject: jest.fn(ok),
    updateProject: jest.fn(ok),
    updateExternalConfig: jest.fn(ok),
    deleteExternalDbConfig: jest.fn(ok),
    deleteExternalStorageConfig: jest.fn(ok),
    analytics: jest.fn(ok),
    updateAllowedDomains: jest.fn(ok),
    toggleAuth: jest.fn(ok),
    updateAuthProviders: jest.fn(ok),
    updateCollectionRls: jest.fn(ok),
    listMailTemplates: jest.fn(ok),
    listGlobalMailTemplates: jest.fn(ok),
    getMailTemplate: jest.fn(ok),
    createMailTemplate: jest.fn(ok),
    updateMailTemplate: jest.fn(ok),
    deleteMailTemplate: jest.fn(ok),
    requestUpload: jest.fn(ok),
    confirmUpload: jest.fn(ok),
  };
});

const express = require('express');
const request = require('supertest');
const projectsRouter = require('../routes/projects');
const projectController = require('../controllers/project.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyEmail, loadProjectForAdmin } = require('@urbackend/common');

let app;

beforeEach(() => {
  jest.clearAllMocks();
  app = express();
  app.use(express.json());
  app.use('/api/projects', projectsRouter);
});

describe('projects storage presigned routes', () => {
  test('legacy proxy upload route is removed', async () => {
    const res = await request(app)
      .post('/api/projects/project1/storage/upload')
      .send({});

    expect(res.status).toBe(404);
  });

  test('upload-request route is wired and protected', async () => {
    const res = await request(app)
      .post('/api/projects/project1/storage/upload-request')
      .send({ filename: 'a.txt', contentType: 'text/plain', size: 10 });

    expect(res.status).toBe(200);
    expect(authMiddleware).toHaveBeenCalled();
    expect(verifyEmail).toHaveBeenCalled();
    expect(loadProjectForAdmin).toHaveBeenCalled();
    expect(projectController.requestUpload).toHaveBeenCalledTimes(1);
  });

  test('upload-confirm route is wired and protected', async () => {
    const res = await request(app)
      .post('/api/projects/project1/storage/upload-confirm')
      .send({ filePath: 'project1/a.txt', size: 10 });

    expect(res.status).toBe(200);
    expect(authMiddleware).toHaveBeenCalled();
    expect(verifyEmail).toHaveBeenCalled();
    expect(loadProjectForAdmin).toHaveBeenCalled();
    expect(projectController.confirmUpload).toHaveBeenCalledTimes(1);
  });
});
