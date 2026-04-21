'use strict';

process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789012345678901234567890a";

jest.mock('resend', () => {
    const sendMock = jest.fn(() => Promise.resolve({ data: { id: 'mail-123' }, error: null }));
    return {
        Resend: jest.fn(() => ({
            emails: { send: sendMock },
        })),
        __sendMock: sendMock,
    };
});

jest.mock('@urbackend/common', () => {
    const { sendMailSchema } = require('../../../../packages/common/src/utils/input.validation');
    const redisMock = {
        status: 'ready',
        incr: jest.fn(),
        expire: jest.fn(),
        decr: jest.fn(),
        eval: jest.fn(),
    };

    return {
        sendMailSchema,
        Project: { findById: jest.fn() },
        MailTemplate: {
            findOne: jest.fn(),
        },
        decrypt: jest.fn(),
        redis: redisMock,
    };
});

const { Resend, __sendMock } = require('resend');
const { Project, MailTemplate, decrypt, redis } = require('@urbackend/common');
const mailController = require('../controllers/mail.controller');

const makeReq = () => ({
    keyRole: 'secret',
    project: { _id: 'proj_1' },
    body: { to: 'user@example.com', subject: 'Hello', text: 'This is a message.' },
});

const makeRes = () => {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
};

const mockProjectConfig = (payload) => {
    Project.findById.mockReturnValue({
        select: jest.fn(() => ({
            lean: jest.fn(() => Promise.resolve(payload)),
        })),
    });
};

const mockMailTemplateFindOne = (value) => {
    MailTemplate.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(value),
    });
};

describe('mail.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.RESEND_API_KEY = 'default-key';
        process.env.EMAIL_FROM = 'mail@urbackend.app';
        MailTemplate.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
        });
    });

    test('sends mail using BYOK key when configured', async () => {
        const req = makeReq();
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: { encrypted: '...' } });
        decrypt.mockReturnValue('byok-key');
        redis.eval.mockResolvedValue(1);

        await mailController.sendMail(req, res);

        expect(redis.eval).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({ provider: 'byok', monthlyUsage: 1 }),
        }));
    });

    test('falls back to default key when BYOK missing', async () => {
        const req = makeReq();
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: null });
        decrypt.mockReturnValue(null);
        redis.eval.mockResolvedValue(2);

        await mailController.sendMail(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ provider: 'default', monthlyUsage: 2 }),
        }));
    });

    test('enforces monthly limit', async () => {
        const req = makeReq();
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: null });
        decrypt.mockReturnValue(null);
        redis.eval.mockResolvedValue(101);

        await mailController.sendMail(req, res);

        expect(redis.decr).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: 'Monthly mail limit exceeded.',
        }));
    });

    test('uses project-scoped MailTemplate lookup when available', async () => {
        const req = makeReq();
        req.body = {
            to: 'user@example.com',
            templateName: 'welcome',
            variables: { name: 'Yash' },
        };
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: null, mailTemplates: [] });
        mockMailTemplateFindOne({
            _id: 'tpl_project',
            projectId: 'proj_1',
            key: 'welcome',
            name: 'welcome',
            subject: 'Hello {{name}}',
            text: 'Welcome, {{name}}!',
            html: '',
        });
        decrypt.mockReturnValue(null);
        redis.eval.mockResolvedValue(1);

        await mailController.sendMail(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                templateUsed: expect.objectContaining({ id: 'tpl_project', scope: 'project' }),
            }),
        }));
    });

    test('falls back to global MailTemplate when project template missing', async () => {
        const req = makeReq();
        req.body = {
            to: 'user@example.com',
            templateName: 'welcome',
            variables: { name: 'Yash' },
        };
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: null, mailTemplates: [] });
        mockMailTemplateFindOne(null);
        mockMailTemplateFindOne({
            _id: 'tpl_global',
            projectId: null,
            isSystem: true,
            key: 'welcome',
            name: 'welcome',
            subject: 'Hello {{name}}',
            text: 'Hello, {{name}}!',
            html: '',
        });
        decrypt.mockReturnValue(null);
        redis.eval.mockResolvedValue(1);

        await mailController.sendMail(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                templateUsed: expect.objectContaining({ id: 'tpl_global', scope: 'global' }),
            }),
        }));
    });

    test('renders and sends a mail template with variables', async () => {
        const req = makeReq();
        req.body = {
            to: 'user@example.com',
            templateName: 'welcome',
            variables: { name: 'Yash' },
        };
        const res = makeRes();

        mockProjectConfig({
            _id: 'proj_1',
            resendApiKey: null,
            mailTemplates: [
                {
                    _id: 'tpl_1',
                    name: 'welcome',
                    subject: 'Hello {{name}}',
                    text: 'Welcome, {{name}}!',
                    html: '<p>Welcome, {{name}}!</p>',
                },
            ],
        });
        decrypt.mockReturnValue(null);
        redis.eval.mockResolvedValue(1);

        await mailController.sendMail(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                templateUsed: expect.objectContaining({ name: 'welcome', id: 'tpl_1', scope: 'project' }),
            }),
        }));
        expect(__sendMock).toHaveBeenCalledWith(expect.objectContaining({
            subject: 'Hello Yash',
            text: 'Welcome, Yash!',
            html: '<p>Welcome, Yash!</p>',
        }));
    });
});
