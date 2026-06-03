'use strict';

process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789012345678901234567890a";

const mockResendClient = {
    batch: { send: jest.fn() },
    audiences: {
        create: jest.fn(),
        list: jest.fn(),
        get: jest.fn(),
        remove: jest.fn(),
    },
    contacts: {
        create: jest.fn(),
        list: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    },
    broadcasts: {
        create: jest.fn(),
        send: jest.fn(),
        list: jest.fn(),
        get: jest.fn(),
        remove: jest.fn(),
    },
    emails: { get: jest.fn() },
};
const mockWebhookVerify = jest.fn();

jest.mock('resend', () => ({
    Resend: jest.fn(() => mockResendClient),
}));

jest.mock('svix', () => ({
    Webhook: jest.fn(() => ({
        verify: mockWebhookVerify,
    })),
}));

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
            findOne: jest.fn(() => ({
                lean: jest.fn(async () => null),
            })),
        },
        decrypt: jest.fn(),
        redis: redisMock,
        getPlanLimits: jest.fn(() => ({ mailPerMonth: 100 })),
        publicEmailQueue: {
            add: jest.fn(() => Promise.resolve({ id: 'job-123' }))
        },
        MailLog: {
            updateOne: jest.fn(),
            insertMany: jest.fn(),
        },
    };
});

const { Project, decrypt, redis, publicEmailQueue, MailTemplate, MailLog } = require('@urbackend/common');
const mailController = require('../controllers/mail.controller');
const originalResendApiKey2 = process.env.RESEND_API_KEY_2;

const makeReq = () => ({
    keyRole: 'secret',
    project: { _id: 'proj_1' },
    body: { to: 'user@example.com', subject: 'Hello', text: 'This is a message.' },
    planLimits: { mailTemplatesEnabled: true },
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

describe('mail.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.RESEND_API_KEY = 'default-key';
        delete process.env.RESEND_API_KEY_2;
        process.env.EMAIL_FROM = 'mail@urbackend.app';
        process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
    });

    afterEach(() => {
        if (typeof originalResendApiKey2 === 'undefined') {
            delete process.env.RESEND_API_KEY_2;
        } else {
            process.env.RESEND_API_KEY_2 = originalResendApiKey2;
        }
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
        expect(publicEmailQueue.add).toHaveBeenCalledWith("send-public-email", expect.objectContaining({
            projectId: 'proj_1',
            usingByok: true,
            payload: expect.objectContaining({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'This is a message.'
            })
        }), expect.objectContaining({
            attempts: 3,
            backoff: expect.objectContaining({ type: 'exponential', delay: 5000 })
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
        expect(publicEmailQueue.add).toHaveBeenCalledWith("send-public-email", expect.objectContaining({
            projectId: 'proj_1',
            usingByok: false,
            payload: expect.objectContaining({
                to: 'user@example.com',
                subject: 'Hello',
                text: 'This is a message.'
            })
        }), expect.objectContaining({
            attempts: 3,
            backoff: expect.objectContaining({ type: 'exponential', delay: 5000 })
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
        expect(publicEmailQueue.add).toHaveBeenCalledWith("send-public-email", expect.objectContaining({
            payload: expect.objectContaining({
                subject: 'Hello Yash',
                text: 'Welcome, Yash!',
                html: '<p>Welcome, Yash!</p>',
            })
        }), expect.objectContaining({ attempts: expect.any(Number) }));
    });

    test('renders and sends a project-scoped mail template from DB', async () => {
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
        });

        MailTemplate.findOne.mockReturnValueOnce({
            lean: jest.fn().mockResolvedValue({
                _id: 'tpl_db_1',
                name: 'welcome',
                subject: 'Hello {{name}}',
                text: 'Welcome to project!',
                html: '<p>Welcome to project!</p>',
                projectId: 'proj_1'
            })
        });

        decrypt.mockReturnValue(null);
        redis.eval.mockResolvedValue(1);

        await mailController.sendMail(req, res);

        // Assert project-scope query was made first
        expect(MailTemplate.findOne).toHaveBeenCalledWith(expect.objectContaining({
            projectId: 'proj_1',
        }));

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                templateUsed: expect.objectContaining({ name: 'welcome', id: 'tpl_db_1', scope: 'project' }),
            }),
        }));
        expect(publicEmailQueue.add).toHaveBeenCalledWith("send-public-email", expect.objectContaining({
            projectId: 'proj_1',
            usingByok: false,
            payload: expect.objectContaining({
                to: 'user@example.com',
                subject: 'Hello Yash',
                text: 'Welcome to project!',
                html: '<p>Welcome to project!</p>'
            })
        }), expect.objectContaining({
            attempts: 3,
            backoff: expect.objectContaining({ type: 'exponential', delay: 5000 })
        }));
    });

    test('renders and sends a global mail template from DB when no project template exists', async () => {
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
        });

        // First call: project scope (returns null)
        MailTemplate.findOne.mockReturnValueOnce({
            lean: jest.fn().mockResolvedValue(null)
        });

        // Second call: global scope
        MailTemplate.findOne.mockReturnValueOnce({
            lean: jest.fn().mockResolvedValue({
                _id: 'tpl_global_1',
                name: 'welcome',
                subject: 'Global Hello {{name}}',
                text: 'Global welcome!',
                html: '<p>Global welcome!</p>',
                projectId: null,
                isSystem: true
            })
        });

        decrypt.mockReturnValue(null);
        redis.eval.mockResolvedValue(1);

        await mailController.sendMail(req, res);

        // Assert project-scope was queried first, then global fallback
        expect(MailTemplate.findOne).toHaveBeenNthCalledWith(1, expect.objectContaining({
            projectId: 'proj_1',
        }));
        expect(MailTemplate.findOne).toHaveBeenNthCalledWith(2, expect.objectContaining({
            projectId: null,
            isSystem: true,
        }));

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                templateUsed: expect.objectContaining({ name: 'welcome', id: 'tpl_global_1', scope: 'global' }),
            }),
        }));
        expect(publicEmailQueue.add).toHaveBeenCalledWith("send-public-email", expect.objectContaining({
            projectId: 'proj_1',
            usingByok: false,
            payload: expect.objectContaining({
                to: 'user@example.com',
                subject: 'Global Hello Yash',
                text: 'Global welcome!',
                html: '<p>Global welcome!</p>'
            })
        }), expect.objectContaining({
            attempts: 3,
            backoff: expect.objectContaining({ type: 'exponential', delay: 5000 })
        }));
    });

    test('refunds quota on terminal async worker failure', async () => {
        let failedHandler;
        jest.resetModules();
        jest.doMock('bullmq', () => ({
            Queue: jest.fn(),
            Worker: jest.fn(() => ({
                on: jest.fn((event, handler) => {
                    if (event === 'failed') failedHandler = handler;
                }),
                removeAllListeners: jest.fn(),
                close: jest.fn()
            }))
        }));

        const mockRedis = { eval: jest.fn().mockResolvedValue(0) };
        jest.doMock('../../../../packages/common/src/config/redis', () => mockRedis);

        const { initPublicEmailWorker, resetPublicEmailWorker } = require('../../../../packages/common/src/queues/publicEmailQueue');
        await resetPublicEmailWorker();
        const worker = initPublicEmailWorker();
        
        const mockJob = {
            id: 'job-999',
            data: { consumedQuotaKey: 'project:mail:count:proj_1:2026-05' },
            opts: { attempts: 3 },
            attemptsMade: 3
        };

        expect(failedHandler).toBeDefined();
        await failedHandler(mockJob, new Error("Terminal failure"));

        expect(mockRedis.eval).toHaveBeenCalledWith(
            expect.any(String), 1, 'project:mail:count:proj_1:2026-05'
        );
    });

    test('does not refund quota on non-terminal async worker failure', async () => {
        let failedHandler;
        jest.resetModules();
        jest.doMock('bullmq', () => ({
            Queue: jest.fn(),
            Worker: jest.fn(() => ({
                on: jest.fn((event, handler) => {
                    if (event === 'failed') failedHandler = handler;
                }),
                removeAllListeners: jest.fn(),
                close: jest.fn()
            }))
        }));

        const mockRedis = { eval: jest.fn().mockResolvedValue(0) };
        jest.doMock('../../../../packages/common/src/config/redis', () => mockRedis);

        const { initPublicEmailWorker, resetPublicEmailWorker } = require('../../../../packages/common/src/queues/publicEmailQueue');
        await resetPublicEmailWorker();
        const worker = initPublicEmailWorker();
        
        const mockJob = {
            id: 'job-888',
            data: { consumedQuotaKey: 'project:mail:count:proj_1:2026-05' },
            opts: { attempts: 3 },
            attemptsMade: 1 // Not terminal yet
        };

        expect(failedHandler).toBeDefined();
        await failedHandler(mockJob, new Error("Temporary failure"));

        expect(mockRedis.eval).not.toHaveBeenCalled();
    });

    test('returns 400 when webhook signature verification fails', async () => {
        const req = { body: Buffer.from('{}'), headers: {} };
        const res = makeRes();
        mockWebhookVerify.mockImplementation(() => {
            throw new Error('invalid signature');
        });

        await mailController.handleResendWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(MailLog.updateOne).not.toHaveBeenCalled();
    });

    test('updates MailLog status when webhook verification succeeds', async () => {
        const req = {
            body: Buffer.from(JSON.stringify({ test: true })),
            headers: { 'svix-id': '1', 'svix-timestamp': '2', 'svix-signature': '3' }
        };
        const res = makeRes();
        mockWebhookVerify.mockReturnValue({
            type: 'email.delivered',
            data: { email_id: 're_123' }
        });

        await mailController.handleResendWebhook(req, res);

        expect(MailLog.updateOne).toHaveBeenCalledWith(
            { resendEmailId: 're_123' },
            expect.objectContaining({ $set: expect.objectContaining({ status: 'delivered' }) })
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('refunds reserved quota when batch provider call fails', async () => {
        const req = makeReq();
        req.body = [{ to: 'u@example.com', subject: 'Batch', text: 'Hello' }];
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: null });
        decrypt.mockReturnValue(null);
        redis.eval.mockResolvedValue(1);
        redis.decr.mockResolvedValue(0);
        mockResendClient.batch.send.mockResolvedValue({
            data: null,
            error: { statusCode: 503, message: 'Provider unavailable' }
        });

        await mailController.sendBatchMail(req, res);

        expect(redis.decr).toHaveBeenCalledWith(expect.stringContaining('project:mail:count:proj_1:'));
        expect(res.status).toHaveBeenCalledWith(503);
    });

    test('enforces BYOK gate for audience creation', async () => {
        const req = makeReq();
        req.body = { name: 'Audience A' };
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: null });
        decrypt.mockReturnValue(null);

        await mailController.createAudience(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockResendClient.audiences.create).not.toHaveBeenCalled();
    });

    test('enforces Pro plan gate for broadcast creation', async () => {
        const req = makeReq();
        req.planLimits = { byokEnabled: false };
        req.body = { audienceId: 'aud_1', subject: 'Hello', html: '<p>Hi</p>' };
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: { encrypted: 'x', iv: 'y', tag: 'z' } });
        decrypt.mockReturnValue('byok-key');

        await mailController.createBroadcast(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(mockResendClient.broadcasts.create).not.toHaveBeenCalled();
    });

    test('accepts audienceId field when creating broadcast', async () => {
        const req = makeReq();
        req.planLimits = { byokEnabled: true };
        req.body = { audienceId: 'aud_123', subject: 'Promo', html: '<p>Deal</p>' };
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: { encrypted: 'x', iv: 'y', tag: 'z' } });
        decrypt.mockReturnValue('byok-key');
        mockResendClient.broadcasts.create.mockResolvedValue({ data: { id: 'b_1' }, error: null });

        await mailController.createBroadcast(req, res);

        expect(mockResendClient.broadcasts.create).toHaveBeenCalledWith(expect.objectContaining({ audienceId: 'aud_123' }));
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
