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
    };

    return {
        sendMailSchema,
        Project: { findById: jest.fn() },
        decrypt: jest.fn(),
        redis: redisMock,
    };
});

const { Resend } = require('resend');
const { Project, decrypt, redis } = require('@urbackend/common');
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

describe('mail.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.RESEND_API_KEY = 'default-key';
        process.env.EMAIL_FROM = 'mail@urbackend.app';
    });

    test('sends mail using BYOK key when configured', async () => {
        const req = makeReq();
        const res = makeRes();

        mockProjectConfig({ _id: 'proj_1', resendApiKey: {} });
        decrypt.mockReturnValue('byok-key');
        redis.incr.mockResolvedValue(1);

        await mailController.sendMail(req, res);

        expect(redis.incr).toHaveBeenCalledTimes(1);
        expect(redis.expire).toHaveBeenCalledTimes(1);
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
        redis.incr.mockResolvedValue(2);

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
        redis.incr.mockResolvedValue(101);

        await mailController.sendMail(req, res);

        expect(redis.decr).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Monthly mail limit exceeded.',
        }));
    });
});
