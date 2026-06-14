'use strict';

// ---------------------------------------------------------------------------
// Mock heavy dependencies before requiring the module under test.
// ---------------------------------------------------------------------------

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('crypto', () => ({
    randomInt: jest.fn(() => 123456),
}));

// Mock @urbackend/common so that mongoose / redis are never touched.
jest.mock('@urbackend/common', () => {
    const z = require('zod');

    // Minimal mock developer instance returned by the model helpers.
    const makeMockUser = (overrides = {}) => ({
        _id: 'dev_id_1',
        email: 'test@example.com',
        isVerified: true,
        maxProjects: 3,
        refreshToken: null,
        password: 'hashed_password',
        save: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    });

    const Developer = jest.fn().mockImplementation((data) => ({
        ...makeMockUser(),
        ...data,
        save: jest.fn().mockResolvedValue(undefined),
    }));
    Developer.findOne = jest.fn();
    Developer.findById = jest.fn();
    Developer.findByIdAndDelete = jest.fn();

    // Helper to mock a Mongoose query that is both chainable (select) and thenable
    Developer.__mockQuery = (value) => {
        const query = {
            select: jest.fn().mockReturnThis(),
            then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
            catch: (reject) => Promise.resolve(value).catch(reject),
        };
        return query;
    };

    const Otp = jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(undefined),
    }));
    Otp.findOne = jest.fn();
    Otp.deleteOne = jest.fn().mockResolvedValue(undefined);

    const Project = jest.fn();
    Project.deleteMany = jest.fn().mockResolvedValue(undefined);

    const PlatformEvent = {
        create: jest.fn().mockResolvedValue(undefined),
    };

    class AppError extends Error {
        constructor(statusCode, message) {
            super(message);
            this.statusCode = statusCode;
            this.isOperational = true;
        }
    }

    return {
        Developer,
        Otp,
        Project,
        PlatformEvent,
        AppError,
        ApiResponse: class ApiResponse {
            constructor(data = {}, message = 'Success') {
                this.data = data;
                this.message = message;
                this.success = true;
            }
            send(res, statusCode = 200) {
                return res.status(statusCode).json({ success: this.success, data: this.data, message: this.message });
            }
        },
        sendOtp: jest.fn().mockResolvedValue(undefined),
        // Use real zod shapes so validation logic is exercised.
        loginSchema: z.object({
            email: z.string().email(),
            password: z.string().min(1),
        }),
        changePasswordSchema: z.object({
            currentPassword: z.string().min(1),
            newPassword: z.string().min(6),
        }),
        deleteAccountSchema: z.object({
            password: z.string().min(1),
        }),
        onlyEmailSchema: z.object({
            email: z.string().email(),
        }),
        verifyOtpSchema: z.object({
            email: z.string().email(),
            otp: z.string(),
        }),
        resetPasswordSchema: z.object({
            email: z.string().email(),
            otp: z.string(),
            newPassword: z.string().min(6),
        }),
    };
});

// ---------------------------------------------------------------------------
// Now safe to import the module under test and its mocked peers.
// ---------------------------------------------------------------------------

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Developer, Otp, Project, sendOtp, AppError } = require('@urbackend/common');
const authController = require('../controllers/auth.controller');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRes = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
        cookie: jest.fn(),
    };
    // Allow chaining: res.status(200).cookie(...).json(...)
    res.status.mockReturnValue(res);
    res.cookie.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
};

const makeReq = (body = {}, user = null, cookies = {}) => ({
    body,
    user,
    cookies,
});

const next = jest.fn();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('auth.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'refresh-secret';
        process.env.NODE_ENV = 'test';
    });

    // -----------------------------------------------------------------------
    describe('register', () => {
        test('returns 201 and success message on valid new-user registration', async () => {
            Developer.findOne.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed_password');

            const mockSave = jest.fn().mockResolvedValue(undefined);
            Developer.mockImplementation(() => ({ save: mockSave }));

            const req = makeReq({ email: 'new@example.com', password: 'password123' });
            const res = makeRes();

            await authController.register(req, res, next);

            expect(Developer.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: {}, message: 'Registered successfully' });
        });

        test('returns 400 when email already exists', async () => {
            Developer.findOne.mockResolvedValue({ email: 'existing@example.com' });

            const req = makeReq({ email: 'existing@example.com', password: 'password123' });
            const res = makeRes();

            await authController.register(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });

        test('returns 400 on Zod validation error (invalid email)', async () => {
            const req = makeReq({ email: 'not-an-email', password: 'password123' });
            const res = makeRes();

            await authController.register(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });
    });

    // -----------------------------------------------------------------------
    describe('login', () => {
        const mockUser = () => ({
            _id: 'dev_id_1',
            email: 'test@example.com',
            isVerified: true,
            maxProjects: 3,
            refreshToken: null,
            password: 'hashed_password',
            save: jest.fn().mockResolvedValue(undefined),
        });

        test('returns 200 with cookie tokens on valid credentials', async () => {
            const user = mockUser();
            Developer.findOne.mockReturnValue(Developer.__mockQuery(user));
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('signed_token');

            const req = makeReq({ email: 'test@example.com', password: 'correctpass' });
            const res = makeRes();

            await authController.login(req, res, next);

            expect(bcrypt.compare).toHaveBeenCalledWith('correctpass', 'hashed_password');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.cookie).toHaveBeenCalledWith('accessToken', expect.any(String), expect.any(Object));
            expect(res.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.any(Object));
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true })
            );
        });

        test('returns 400 when user is not found', async () => {
            Developer.findOne.mockReturnValue(Developer.__mockQuery(null));

            const req = makeReq({ email: 'noone@example.com', password: 'pass' });
            const res = makeRes();

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toBe('Invalid email or password');
        });

        test('returns 400 on invalid password', async () => {
            Developer.findOne.mockReturnValue(Developer.__mockQuery(mockUser()));
            bcrypt.compare.mockResolvedValue(false);

            const req = makeReq({ email: 'test@example.com', password: 'wrongpass' });
            const res = makeRes();

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toBe('Invalid email or password');
        });

        test('returns 400 on Zod validation error (missing password)', async () => {
            const req = makeReq({ email: 'test@example.com' });
            const res = makeRes();

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });
    });

    // -----------------------------------------------------------------------
    describe('refreshToken', () => {
        const mockUser = () => ({
            _id: 'dev_id_1',
            email: 'test@example.com',
            isVerified: true,
            maxProjects: 3,
            refreshToken: 'valid_refresh_token',
            password: 'hashed_password',
            save: jest.fn().mockResolvedValue(undefined),
        });

        test('returns 200 with new tokens when refresh token is valid', async () => {
            const user = mockUser();
            jwt.verify.mockReturnValue({ _id: 'dev_id_1' });
            Developer.findById.mockReturnValue(Developer.__mockQuery(user));
            jwt.sign.mockReturnValue('new_token');

            const req = makeReq({}, null, { refreshToken: 'valid_refresh_token' });
            const res = makeRes();

            await authController.refreshToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid_refresh_token', 'refresh-secret');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('returns 401 when no refresh token is provided', async () => {
            const req = makeReq({}, null, {});
            const res = makeRes();

            await authController.refreshToken(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(401);
            expect(next.mock.calls[0][0].message).toBe('No refresh token provided');
        });

        test('returns 403 when refresh token is invalid (jwt.verify throws)', async () => {
            jwt.verify.mockImplementation(() => {
                const err = new Error('invalid token');
                err.name = 'JsonWebTokenError';
                throw err;
            });

            const req = makeReq({}, null, { refreshToken: 'bad_token' });
            const res = makeRes();

            await authController.refreshToken(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
        });

        test('returns 403 when stored refresh token does not match', async () => {
            jwt.verify.mockReturnValue({ _id: 'dev_id_1' });
            Developer.findById.mockReturnValue(Developer.__mockQuery({ ...mockUser(), refreshToken: 'different_token' }));

            const req = makeReq({}, null, { refreshToken: 'valid_refresh_token' });
            const res = makeRes();

            await authController.refreshToken(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
            expect(next.mock.calls[0][0].message).toBe('Invalid refresh token');
        });
    });

    // -----------------------------------------------------------------------
    describe('logout', () => {
        test('clears cookies and returns success', async () => {
            const mockUser = {
                _id: 'dev_id_1',
                refreshToken: 'some_token',
                save: jest.fn().mockResolvedValue(undefined),
            };
            Developer.findById.mockResolvedValue(mockUser);

            const req = makeReq({}, { _id: 'dev_id_1' });
            const res = makeRes();

            await authController.logout(req, res, next);

            expect(mockUser.save).toHaveBeenCalled();
            expect(mockUser.refreshToken).toBeNull();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
                message: 'Logged out successfully',
            });
        });

        test('still returns success when req.user is absent', async () => {
            const req = makeReq();
            const res = makeRes();

            await authController.logout(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // -----------------------------------------------------------------------
    describe('getMe', () => {
        test('returns the user object without sensitive fields', async () => {
            const mockSelect = jest.fn().mockResolvedValue({
                _id: 'dev_id_1',
                email: 'test@example.com',
            });
            Developer.findById.mockReturnValue({ select: mockSelect });

            const req = makeReq({}, { _id: 'dev_id_1' });
            const res = makeRes();

            await authController.getMe(req, res, next);

            expect(Developer.findById).toHaveBeenCalledWith('dev_id_1');
            expect(mockSelect).toHaveBeenCalledWith('-password -refreshToken');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true })
            );
        });

        test('returns 404 when user does not exist', async () => {
            Developer.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            const req = makeReq({}, { _id: 'missing_id' });
            const res = makeRes();

            await authController.getMe(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(404);
            expect(next.mock.calls[0][0].message).toBe('User not found');
        });
    });

    // -----------------------------------------------------------------------
    describe('changePassword', () => {
        test('returns 200 on successful password change', async () => {
            const mockUser = {
                _id: 'dev_id_1',
                password: 'old_hashed',
                save: jest.fn().mockResolvedValue(undefined),
            };
            Developer.findById.mockReturnValue(Developer.__mockQuery(mockUser));
            bcrypt.compare.mockResolvedValue(true);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('new_hashed');

            const req = makeReq(
                { currentPassword: 'oldpass', newPassword: 'newpass123' },
                { _id: 'dev_id_1' }
            );
            const res = makeRes();

            await authController.changePassword(req, res, next);

            expect(bcrypt.compare).toHaveBeenCalledWith('oldpass', 'old_hashed');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
                message: 'Password updated successfully',
            });
        });

        test('returns 400 when current password is incorrect', async () => {
            Developer.findById.mockReturnValue(Developer.__mockQuery({
                password: 'old_hashed',
                save: jest.fn(),
            }));
            bcrypt.compare.mockResolvedValue(false);

            const req = makeReq(
                { currentPassword: 'wrongold', newPassword: 'newpass123' },
                { _id: 'dev_id_1' }
            );
            const res = makeRes();

            await authController.changePassword(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toBe('Incorrect current password');
        });
    });

    // -----------------------------------------------------------------------
    describe('sendOtp', () => {
        test('returns 400 when user is not found', async () => {
            Developer.findOne.mockReturnValue(Developer.__mockQuery(null));

            const req = makeReq({ email: 'noone@example.com' });
            const res = makeRes();

            await authController.sendOtp(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toBe('User not found. Ensure you are using the correct email.');
        });

        test('returns 400 when user is already verified', async () => {
            Developer.findOne.mockReturnValue(Developer.__mockQuery({ _id: 'u1', isVerified: true }));

            const req = makeReq({ email: 'verified@example.com' });
            const res = makeRes();

            await authController.sendOtp(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toBe('Account is already verified. Please login.');
        });

        test('sends OTP and returns success for unverified user', async () => {
            const user = { _id: 'u1', isVerified: false };
            Developer.findOne.mockReturnValue(Developer.__mockQuery(user));
            Otp.deleteOne.mockResolvedValue(undefined);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed_otp');
            const mockOtpInstance = { save: jest.fn().mockResolvedValue(undefined) };
            Otp.mockImplementation(() => mockOtpInstance);
            sendOtp.mockResolvedValue(undefined);

            const req = makeReq({ email: 'unverified@example.com' });
            const res = makeRes();

            await authController.sendOtp(req, res, next);

            expect(sendOtp).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ success: true, data: {}, message: 'OTP sent successfully' });
        });
    });

    // -----------------------------------------------------------------------
    describe('forgotPassword', () => {
        test('returns the same message regardless of whether user exists (prevents email enumeration)', async () => {
            Developer.findOne.mockReturnValue(Developer.__mockQuery(null));

            const req = makeReq({ email: 'ghost@example.com' });
            const res = makeRes();

            await authController.forgotPassword(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('OTP has been sent') })
            );
        });
    });

    // -----------------------------------------------------------------------
    describe('resetPassword', () => {
        test('clears stored refresh token after successful password reset', async () => {
            const mockOtpDoc = {
                attempts: 0,
                otp: 'hashed_otp',
                deleteOne: jest.fn().mockResolvedValue(undefined),
                save: jest.fn().mockResolvedValue(undefined),
            };
            const mockUser = {
                _id: 'dev_id_1',
                email: 'test@example.com',
                password: 'old_hashed_password',
                refreshToken: 'active_refresh_token',
                save: jest.fn().mockResolvedValue(undefined),
            };

            Developer.findOne.mockReturnValue(Developer.__mockQuery(mockUser));
            Otp.findOne.mockResolvedValue(mockOtpDoc);
            bcrypt.compare.mockResolvedValue(true);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('new_hashed_password');

            const req = makeReq({
                email: 'test@example.com',
                otp: '123456',
                newPassword: 'newpassword123',
            });
            const res = makeRes();

            await authController.resetPassword(req, res, next);

            expect(mockUser.refreshToken).toBeNull();
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.cookie).toHaveBeenCalledWith(
                'accessToken',
                'none',
                expect.objectContaining({ httpOnly: true })
            );
            expect(res.cookie).toHaveBeenCalledWith(
                'refreshToken',
                'none',
                expect.objectContaining({ httpOnly: true })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
                message: 'Password reset successfully. Please log in with your new password.'
            });
        });
    });
});
