'use strict';

process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const store = new Map();
const mockRedis = {
    status: 'ready',
    set: jest.fn((key, val) => {
        store.set(key, val);
        return Promise.resolve('OK');
    }),
    get: jest.fn((key) => {
        return Promise.resolve(store.get(key) || null);
    }),
    del: jest.fn((key) => {
        const existed = store.has(key);
        store.delete(key);
        return Promise.resolve(existed ? 1 : 0);
    }),
};

// Mock the redis configuration module used by packages/common
jest.mock('../../../../packages/common/src/config/redis', () => mockRedis);

const {
    setProjectByApiKeyCache,
    getProjectByApiKeyCache,
    deleteProjectByApiKeyCache,
    setProjectById,
    getProjectById,
} = require('../../../../packages/common/src/redis/redisCaching');

const { hashApiKey } = require('../../../../packages/common/src/utils/api');

describe('redisCaching functions', () => {
    beforeEach(() => {
        store.clear();
        jest.clearAllMocks();
    });

    test('setProjectByApiKeyCache encrypts jwtSecret and getProjectByApiKeyCache decrypts it', async () => {
        const project = {
            _id: 'project_1',
            name: 'Test Project',
            jwtSecret: 'super-secret-jwt-key',
            allowedDomains: ['*'],
        };

        await setProjectByApiKeyCache('pk_live_123', project);

        // Verify the mockRedis.set was called
        expect(mockRedis.set).toHaveBeenCalled();

        // Inspect stored value
        const storedStr = store.get('project:apikey:pk_live_123');
        expect(storedStr).toBeDefined();

        const storedData = JSON.parse(storedStr);
        // jwtSecret should NOT be the raw plaintext string
        expect(storedData.jwtSecret).not.toBe('super-secret-jwt-key');
        expect(storedData.jwtSecret).toHaveProperty('iv');
        expect(storedData.jwtSecret).toHaveProperty('encrypted');
        expect(storedData.jwtSecret).toHaveProperty('tag');

        // Retrieve and verify it is decrypted
        const retrieved = await getProjectByApiKeyCache('pk_live_123');
        expect(retrieved.jwtSecret).toBe('super-secret-jwt-key');
        expect(retrieved.name).toBe('Test Project');
    });

    test('getProjectByApiKeyCache falls back gracefully to plaintext jwtSecret (migration path)', async () => {
        // Manually store raw plaintext jwtSecret in Redis store
        const oldData = {
            _id: 'project_2',
            name: 'Old Cache Project',
            jwtSecret: 'plaintext-old-secret',
        };
        store.set('project:apikey:pk_live_456', JSON.stringify(oldData));

        const retrieved = await getProjectByApiKeyCache('pk_live_456');
        expect(retrieved.jwtSecret).toBe('plaintext-old-secret');
    });

    test('setProjectById encrypts jwtSecret and getProjectById decrypts it', async () => {
        const project = {
            _id: 'project_id_1',
            jwtSecret: 'id-secret',
        };

        await setProjectById('project_id_1', project);

        const storedStr = store.get('project:id:project_id_1');
        const storedData = JSON.parse(storedStr);
        expect(storedData.jwtSecret).not.toBe('id-secret');

        const retrieved = await getProjectById('project_id_1');
        expect(retrieved.jwtSecret).toBe('id-secret');
    });

    test('deleteProjectByApiKeyCache invalidates both raw and hashed keys', async () => {
        const rawKey = 'pk_live_some_test_key';
        const hashedKey = hashApiKey(rawKey);

        // Put mock entries for both keys
        store.set(`project:apikey:${rawKey}`, 'raw_val');
        store.set(`project:apikey:${hashedKey}`, 'hashed_val');

        await deleteProjectByApiKeyCache(rawKey);

        // Both keys should be deleted
        expect(store.has(`project:apikey:${rawKey}`)).toBe(false);
        expect(store.has(`project:apikey:${hashedKey}`)).toBe(false);
    });

    test('deleteProjectByApiKeyCache invalidates only the hashed key if a hashed key is passed', async () => {
        const hashedKey = hashApiKey('pk_live_some_test_key');
        store.set(`project:apikey:${hashedKey}`, 'hashed_val');

        await deleteProjectByApiKeyCache(hashedKey);

        expect(store.has(`project:apikey:${hashedKey}`)).toBe(false);
    });
});
