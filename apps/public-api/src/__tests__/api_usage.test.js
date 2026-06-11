'use strict';

const mockLogCreate = jest.fn();
const mockApiAnalyticsCreate = jest.fn();
const mockIncrWithTtlAtomic = jest.fn();

jest.mock('@urbackend/common', () => ({
    Log: {
        create: (...args) => mockLogCreate(...args),
    },
    ApiAnalytics: {
        create: (...args) => mockApiAnalyticsCreate(...args),
    },
    redis: {
        set: jest.fn().mockResolvedValue(null),
    },
    getDayKey: () => '2026-06-08',
    DEFAULT_DAILY_TTL_SECONDS: 86400,
    incrWithTtlAtomic: (...args) => mockIncrWithTtlAtomic(...args),
}));

const { logger } = require('../middlewares/api_usage');

describe('api_usage middleware', () => {
    let req, res, next;
    let finishCallback;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            project: { _id: 'test_project_id' },
            method: 'GET',
            originalUrl: '/api/data/test-endpoint',
            ip: '127.0.0.1',
            _dailyCountIncremented: false,
        };
        res = {
            statusCode: 200,
            on: jest.fn((event, cb) => {
                if (event === 'finish') {
                    finishCallback = cb;
                }
            }),
        };
        next = jest.fn();
    });

    test('registers finish listener and calls next()', () => {
        logger(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    test('does not register finish listener for non-analytics routes', () => {
        req.originalUrl = '/other/route';
        logger(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.on).not.toHaveBeenCalled();
    });

    test('handles successful Log.create and ApiAnalytics.create', async () => {
        mockLogCreate.mockResolvedValue({ _id: 'log_id' });
        mockApiAnalyticsCreate.mockResolvedValue({ _id: 'analytics_id' });
        mockIncrWithTtlAtomic.mockResolvedValue(1);

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        logger(req, res, next);
        expect(finishCallback).toBeDefined();

        // Trigger finish callback
        await finishCallback();

        expect(mockLogCreate).toHaveBeenCalledWith({
            projectId: 'test_project_id',
            method: 'GET',
            path: '/api/data/test-endpoint',
            status: 200,
            ip: '127.0.0.1',
        });
        // Assert the exact Redis key pattern and TTL value, not just invocation
        expect(mockIncrWithTtlAtomic).toHaveBeenCalledWith(
            expect.anything(), // redis instance
            'project:usage:req:count:test_project_id:2026-06-08',
            86400
        );

        // Wait for setImmediate callbacks to execute
        await new Promise((resolve) => setImmediate(resolve));

        expect(mockApiAnalyticsCreate).toHaveBeenCalledWith({
            projectId: 'test_project_id',
            endpoint: '/api/data/test-endpoint',
            method: 'GET',
            statusCode: 200,
            responseTimeMs: expect.any(Number),
        });

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Logged: GET /api/data/test-endpoint'));
        consoleLogSpy.mockRestore();
    });

    test('handles Log.create database failure gracefully without crashing', async () => {
        const dbError = new Error('Database connection failed');
        mockLogCreate.mockRejectedValue(dbError);
        mockApiAnalyticsCreate.mockResolvedValue({ _id: 'analytics_id' });
        mockIncrWithTtlAtomic.mockResolvedValue(1);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        logger(req, res, next);
        await finishCallback();

        // Log.create is fire-and-forget, so it will resolve/reject asynchronously.
        // We wait a tiny bit to make sure its catch block runs.
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mockLogCreate).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Logging failed:', dbError.message);

        consoleErrorSpy.mockRestore();
    });

    test('handles ApiAnalytics.create database failure gracefully without crashing', async () => {
        mockLogCreate.mockResolvedValue({ _id: 'log_id' });
        const analyticsError = new Error('Analytics write failed');
        mockApiAnalyticsCreate.mockRejectedValue(analyticsError);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        logger(req, res, next);
        await finishCallback();

        // Wait for setImmediate to trigger the analytics write and catch block
        await new Promise((resolve) => setImmediate(resolve));

        expect(mockApiAnalyticsCreate).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save API analytics:', analyticsError.message);

        consoleErrorSpy.mockRestore();
    });
});
