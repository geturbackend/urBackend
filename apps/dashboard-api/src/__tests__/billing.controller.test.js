'use strict';

const crypto = require('crypto');

class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

jest.mock('@urbackend/common', () => ({
    Developer: {
        findById: jest.fn().mockReturnThis(),
        findOne: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
    },
    ProRequest: {
        findOne: jest.fn(),
        create: jest.fn(),
        find: jest.fn().mockReturnThis(),
        findById: jest.fn(),
        sort: jest.fn().mockReturnThis(),
    },
    AppError,
    sendProRequestConfirmationEmail: jest.fn().mockResolvedValue(true),
    sanitizeNonEmptyString: jest.fn(str => (typeof str === 'string' && str.trim() !== '' ? str.trim() : null)),
    sanitizeObjectId: jest.fn(id => id),
}));

jest.mock('razorpay', () => {
    return jest.fn().mockImplementation(() => ({
        subscriptions: {
            create: jest.fn().mockResolvedValue({ id: 'sub_test_123' }),
        },
    }));
});

const { Developer, ProRequest, sendProRequestConfirmationEmail } = require('@urbackend/common');
const controller = require('../controllers/billing.controller');

describe('Billing Controller', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            user: { _id: 'dev_123', isAdmin: false },
            headers: {},
        };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };
        next = jest.fn();

        process.env.RAZORPAY_KEY_ID = 'test_key';
        process.env.RAZORPAY_KEY_SECRET = 'test_secret';
        process.env.RAZORPAY_PLAN_ID = 'plan_test';
        process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret';
    });

    describe('createCheckout', () => {
        test('returns 403 immediately due to Beta toggle', async () => {
            await controller.createCheckout(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
            expect(next.mock.calls[0][0].message).toContain('Automatic payments are disabled');
        });
    });

    describe('createProRequest', () => {
        test('successfully creates a request and sends email', async () => {
            req.body = { email: 'test@example.com', bio: 'I need pro for my app' };
            ProRequest.findOne.mockResolvedValueOnce(null);
            ProRequest.create.mockResolvedValueOnce({ _id: 'req_123', email: 'test@example.com' });

            await controller.createProRequest(req, res, next);

            expect(ProRequest.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                bio: 'I need pro for my app',
            });
            expect(sendProRequestConfirmationEmail).toHaveBeenCalledWith('test@example.com');
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        test('returns 400 if missing email or bio', async () => {
            req.body = { email: 'test@example.com' }; // Missing bio

            await controller.createProRequest(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(ProRequest.create).not.toHaveBeenCalled();
        });

        test('returns 400 if request already exists', async () => {
            req.body = { email: 'test@example.com', bio: 'bio' };
            ProRequest.findOne.mockResolvedValueOnce({ _id: 'existing_req' });

            await controller.createProRequest(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(ProRequest.create).not.toHaveBeenCalled();
        });
    });

    describe('getProRequests', () => {
        test('returns 403 if user is not admin', async () => {
            req.user.isAdmin = false;
            await controller.getProRequests(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
        });

        test('returns requests if user is admin', async () => {
            req.user.isAdmin = true;
            ProRequest.sort.mockResolvedValueOnce([{ _id: 'req_1' }]);

            await controller.getProRequests(req, res, next);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: [{ _id: 'req_1' }]
            }));
        });
    });

    describe('approveProRequest', () => {
        test('returns 403 if user is not admin', async () => {
            req.user.isAdmin = false;
            await controller.approveProRequest(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
        });

        test('successfully approves and upgrades developer', async () => {
            req.user.isAdmin = true;
            req.body.requestId = 'req_123';

            const mockRequest = { email: 'dev@test.com', status: 'pending', save: jest.fn() };
            const mockDeveloper = { email: 'dev@test.com', plan: 'free', save: jest.fn() };

            ProRequest.findById.mockResolvedValueOnce(mockRequest);
            Developer.findOne.mockResolvedValueOnce(mockDeveloper);

            await controller.approveProRequest(req, res, next);

            expect(mockDeveloper.plan).toBe('pro');
            expect(mockDeveloper.planExpiresAt).toBeInstanceOf(Date);
            expect(mockDeveloper.save).toHaveBeenCalled();
            expect(mockRequest.status).toBe('approved');
            expect(mockRequest.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        test('returns 400 if already approved', async () => {
            req.user.isAdmin = true;
            req.body.requestId = 'req_123';

            const mockRequest = { email: 'dev@test.com', status: 'approved' };
            ProRequest.findById.mockResolvedValueOnce(mockRequest);

            await controller.approveProRequest(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toContain('already approved');
        });
    });

    describe('handleWebhook', () => {
        test('returns 401 if signature is missing', async () => {
            await controller.handleWebhook(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });

        test('returns 401 if signature is invalid', async () => {
            req.headers['x-razorpay-signature'] = '0'.repeat(64);
            req.body = { event: 'subscription.activated' };

            await controller.handleWebhook(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('processes valid webhook signature and upgrades plan', async () => {
            const payload = {
                event: 'subscription.activated',
                payload: {
                    subscription: {
                        entity: {
                            notes: { developer_id: 'dev_123' },
                            current_end: Math.floor(Date.now() / 1000) + 2592000,
                        }
                    }
                }
            };
            req.body = payload;

            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET);
            hmac.update(JSON.stringify(payload));
            req.headers['x-razorpay-signature'] = hmac.digest('hex');

            const mockDeveloper = { plan: 'free', save: jest.fn() };
            Developer.findById.mockResolvedValueOnce(mockDeveloper);

            await controller.handleWebhook(req, res, next);

            expect(Developer.findById).toHaveBeenCalledWith('dev_123');
            expect(mockDeveloper.plan).toBe('pro');
            expect(mockDeveloper.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
        
        test('acknowledges subscription.cancelled without immediately changing plan', async () => {
            const payload = {
                event: 'subscription.cancelled',
                payload: {
                    subscription: {
                        entity: {
                            notes: { developer_id: 'dev_123' },
                        }
                    }
                }
            };
            req.body = payload;

            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET);
            hmac.update(JSON.stringify(payload));
            req.headers['x-razorpay-signature'] = hmac.digest('hex');

            const mockDeveloper = { plan: 'pro', save: jest.fn() };
            Developer.findById.mockResolvedValueOnce(mockDeveloper);

            await controller.handleWebhook(req, res, next);

            expect(mockDeveloper.save).not.toHaveBeenCalled(); // Should not downgrade immediately
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
