'use strict';

jest.mock('@urbackend/common', () => {
    const Waitlist = jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(true)
    }));
    Waitlist.findOne = jest.fn();
    Waitlist.countDocuments = jest.fn();
    Waitlist.find = jest.fn();

    const Developer = {
        findById: jest.fn()
    };

    return {
        Waitlist,
        Developer,
        sendWaitlistConfirmationEmail: jest.fn().mockResolvedValue({})
    };
});

const { Waitlist, sendWaitlistConfirmationEmail, Developer } = require('@urbackend/common');
const waitlistController = require('../controllers/waitlist.controller');

describe('waitlist.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ADMIN_EMAIL = 'admin@example.com';
    });

    const makeRes = () => {
        const res = { status: jest.fn(), json: jest.fn() };
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        return res;
    };

    describe('addToWaitlist', () => {
        it('validates email format', async () => {
            const req = { body: { email: 'invalid' } };
            const res = makeRes();
            await waitlistController.addToWaitlist(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: expect.any(String) }));
        });

        it('rejects duplicate email', async () => {
            Waitlist.findOne.mockResolvedValue({ email: 'test@example.com' });
            const req = { body: { email: 'test@example.com' } };
            const res = makeRes();
            await waitlistController.addToWaitlist(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "You're already on the list!" });
        });

        it('saves new email and triggers confirmation email', async () => {
            Waitlist.findOne.mockResolvedValue(null);
            const req = { body: { email: 'NEW@example.com' } };
            const res = makeRes();
            await waitlistController.addToWaitlist(req, res);
            
            expect(Waitlist).toHaveBeenCalledWith({ email: 'new@example.com' });
            expect(sendWaitlistConfirmationEmail).toHaveBeenCalledWith('new@example.com');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Added to waitlist successfully." });
        });
    });

    describe('getWaitlistCount', () => {
        it('returns count', async () => {
            Waitlist.countDocuments.mockResolvedValue(42);
            const req = {};
            const res = makeRes();
            await waitlistController.getWaitlistCount(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: 42 });
        });
    });

    describe('getWaitlist', () => {
        it('rejects non-admins', async () => {
            Developer.findById.mockResolvedValue({ email: 'user@example.com' });
            const req = { user: { _id: '123' } };
            const res = makeRes();
            await waitlistController.getWaitlist(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('accepts admin and returns data', async () => {
            Developer.findById.mockResolvedValue({ email: 'admin@example.com' });
            Waitlist.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([{ email: 'test@example.com' }])
            });
            Waitlist.countDocuments.mockResolvedValue(1);

            const req = { user: { _id: 'admin_id' } };
            const res = makeRes();
            await waitlistController.getWaitlist(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: { count: 1, waitlist: [{ email: 'test@example.com' }] }});
        });
    });
});
