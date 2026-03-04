
jest.mock('ioredis', () => {
    const Redis = jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        quit: jest.fn().mockResolvedValue('OK'),
        status: 'ready',
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(null),
        del: jest.fn().mockResolvedValue(1),
        options: {},
    }));
    return Redis;
});

jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
    })),
    Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
    })),
}));
