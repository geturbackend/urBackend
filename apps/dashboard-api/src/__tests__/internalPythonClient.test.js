const axios = require('axios');
const crypto = require('crypto');
const { forwardToPythonService } = require('../utils/internalPythonClient');

describe('internalPythonClient', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv };
        jest.clearAllMocks();
        
        // Mock Date.now to freeze timestamp for assertions
        jest.spyOn(Date, 'now').mockImplementation(() => 1609459200000); // 2021-01-01T00:00:00.000Z
        jest.spyOn(axios, 'post').mockResolvedValue({ data: { success: true } });
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    test('throws error if INTERNAL_SECRET is missing', async () => {
        delete process.env.INTERNAL_SECRET;
        
        await expect(forwardToPythonService('/test', {}))
            .rejects
            .toThrow("INTERNAL_SECRET is not defined in environment");
    });

    test('generates correct HMAC signature and calls axios', async () => {
        process.env.INTERNAL_SECRET = 'test-secret';
        process.env.PYTHON_SERVICE_URL = 'http://test-python.local';
        
        const path = '/ai/query-builder';
        const payload = { prompt: "test prompt" };
        const payloadString = JSON.stringify(payload);
        const timestamp = "1609459200000";
        
        // Calculate expected signature manually
        const expectedSignature = crypto
            .createHmac('sha256', 'test-secret')
            .update(`${timestamp}.${payloadString}`)
            .digest('hex');

        const result = await forwardToPythonService(path, payload);

        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(axios.post).toHaveBeenCalledWith(
            `http://test-python.local${path}`,
            payloadString,
            {
                headers: {
                    'X-Internal-Signature': expectedSignature,
                    'X-Timestamp': timestamp,
                    'Content-Type': 'application/json'
                }
            }
        );
        expect(result).toEqual({ success: true });
    });
});
