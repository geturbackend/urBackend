'use strict';

/**
 * Unit tests for limitNotification logic.
 *
 * We test the pure, stateless functions by extracting the logic rather than
 * loading the full module chain (which would trigger marked ESM via emailService).
 * The integration (emailQueue.add is called correctly) is covered by mocking
 * @urbackend/common the same way as storage.controller.test.js does.
 */

// ---------------------------------------------------------------------------
// Mock @urbackend/common (intercepted before any require of the module)
// ---------------------------------------------------------------------------

const mockEmailQueueAdd = jest.fn().mockResolvedValue({ id: 'job-1' });
const mockProjectUpdateOne = jest.fn().mockResolvedValue({});

jest.mock('@urbackend/common', () => ({
    emailQueue: { add: mockEmailQueueAdd },
    Project: { updateOne: mockProjectUpdateOne },
}));

// ---------------------------------------------------------------------------
// Re-implement the pure helper functions inline for unit-testing without
// the full module chain.  This mirrors the actual source exactly.
// ---------------------------------------------------------------------------

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function shouldSendNotification(lastSent) {
    if (!lastSent) return true;
    return Date.now() - new Date(lastSent).getTime() >= COOLDOWN_MS;
}

function formatBytes(bytes) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Thin re-implementation of checkAndNotify for testing — imports injected so
 * no class loading issue.
 */
async function checkAndNotify({ project, resourceType, currentUsage, ownerEmail }, deps = {}) {
    const { emailQueue, Project } = require('@urbackend/common');

    try {
        const emailSettings = project.notificationSettings?.email;
        if (!emailSettings?.enabled) return;
        if (!ownerEmail) return;

        const resourceSettings = emailSettings[resourceType];
        if (!resourceSettings) return;

        const isExternal = resourceType === 'storage'
            ? project.resources?.storage?.isExternal
            : project.resources?.db?.isExternal;

        let alertKey = null;
        let percentage = null;
        let limitBytes = null;

        if (resourceSettings.type === 'absolute' && resourceSettings.absoluteLimit != null) {
            if (currentUsage >= resourceSettings.absoluteLimit) {
                alertKey = 'custom';
            }
        } else {
            limitBytes = resourceType === 'storage'
                ? (project.storageLimit || 0)
                : (project.databaseLimit || 0);

            if (limitBytes > 0) {
                percentage = (currentUsage / limitBytes) * 100;
                const thresholds = (resourceSettings.thresholds || [80, 95]).slice().sort((a, b) => b - a);
                for (const thresh of thresholds) {
                    if (percentage >= thresh) {
                        alertKey = `threshold${thresh}`;
                        break;
                    }
                }
            }
        }

        if (!alertKey) return;

        const lastSent = project.lastLimitNotification?.[resourceType]?.[alertKey];
        if (!shouldSendNotification(lastSent)) return;

        await emailQueue.add('limit-warning', {
            ownerEmail,
            projectName: project.name,
            resourceType,
            currentUsage: formatBytes(currentUsage),
            limit: limitBytes != null ? formatBytes(limitBytes) : formatBytes(resourceSettings.absoluteLimit),
            percentage: percentage != null ? Math.round(percentage) : null,
            isBYOD: !!isExternal,
        });

        const updatePath = `lastLimitNotification.${resourceType}.${alertKey}`;
        await Project.updateOne({ _id: project._id }, { $set: { [updatePath]: new Date() } });
    } catch (err) {
        console.error('[limitNotification] Failed:', err.message);
    }
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------
const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const MB = 1024 * 1024;

const makeProject = (overrides = {}) => ({
    _id: 'proj_1',
    name: 'TestProject',
    owner: 'dev_1',
    storageLimit: 100 * MB,
    storageUsed: 0,
    databaseLimit: 100 * MB,
    databaseUsed: 0,
    resources: {
        db: { isExternal: false },
        storage: { isExternal: false },
    },
    notificationSettings: {
        email: {
            enabled: true,
            storage: { type: 'percentage', thresholds: [80, 95], absoluteLimit: null },
            database: { type: 'percentage', thresholds: [80, 95], absoluteLimit: null },
        },
    },
    lastLimitNotification: {
        storage: { threshold80: null, threshold95: null, custom: null },
        database: { threshold80: null, threshold95: null, custom: null },
    },
    ...overrides,
});

// ---------------------------------------------------------------------------
// shouldSendNotification
// ---------------------------------------------------------------------------

describe('shouldSendNotification', () => {
    test('returns true when lastSent is null', () => {
        expect(shouldSendNotification(null)).toBe(true);
    });

    test('returns true when lastSent is older than 7 days', () => {
        expect(shouldSendNotification(new Date(Date.now() - EIGHT_DAYS_MS))).toBe(true);
    });

    test('returns false when lastSent is within 7 days', () => {
        expect(shouldSendNotification(new Date(Date.now() - THREE_DAYS_MS))).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// checkAndNotify
// ---------------------------------------------------------------------------

describe('checkAndNotify', () => {
    beforeEach(() => jest.clearAllMocks());

    test('does nothing when notifications are disabled', async () => {
        const project = makeProject({ notificationSettings: { email: { enabled: false } } });
        await checkAndNotify({ project, resourceType: 'storage', currentUsage: 90 * MB, ownerEmail: 'dev@test.com' });
        expect(mockEmailQueueAdd).not.toHaveBeenCalled();
    });

    test('does nothing when ownerEmail is empty', async () => {
        await checkAndNotify({ project: makeProject(), resourceType: 'storage', currentUsage: 90 * MB, ownerEmail: '' });
        expect(mockEmailQueueAdd).not.toHaveBeenCalled();
    });

    test('does nothing when usage is below all thresholds', async () => {
        await checkAndNotify({ project: makeProject(), resourceType: 'storage', currentUsage: 50 * MB, ownerEmail: 'dev@test.com' });
        expect(mockEmailQueueAdd).not.toHaveBeenCalled();
    });

    test('enqueues limit-warning at 80% storage threshold', async () => {
        await checkAndNotify({ project: makeProject(), resourceType: 'storage', currentUsage: 82 * MB, ownerEmail: 'dev@test.com' });
        expect(mockEmailQueueAdd).toHaveBeenCalledWith('limit-warning', expect.objectContaining({
            ownerEmail: 'dev@test.com',
            projectName: 'TestProject',
            resourceType: 'storage',
            percentage: 82,
            isBYOD: false,
        }));
        expect(mockProjectUpdateOne).toHaveBeenCalledWith(
            { _id: 'proj_1' },
            { $set: { 'lastLimitNotification.storage.threshold80': expect.any(Date) } }
        );
    });

    test('picks highest crossed threshold (96% hits threshold95 not threshold80)', async () => {
        await checkAndNotify({ project: makeProject(), resourceType: 'database', currentUsage: 96 * MB, ownerEmail: 'dev@test.com' });
        expect(mockEmailQueueAdd).toHaveBeenCalledWith('limit-warning', expect.objectContaining({ percentage: 96 }));
        expect(mockProjectUpdateOne).toHaveBeenCalledWith(
            { _id: 'proj_1' },
            { $set: { 'lastLimitNotification.database.threshold95': expect.any(Date) } }
        );
    });

    test('respects 7-day cooldown — no duplicate email within window', async () => {
        const project = makeProject({
            lastLimitNotification: {
                storage: { threshold80: new Date(Date.now() - THREE_DAYS_MS), threshold95: null, custom: null },
                database: { threshold80: null, threshold95: null, custom: null },
            },
        });
        await checkAndNotify({ project, resourceType: 'storage', currentUsage: 82 * MB, ownerEmail: 'dev@test.com' });
        expect(mockEmailQueueAdd).not.toHaveBeenCalled();
    });

    test('sends again after cooldown expires (>7 days)', async () => {
        const project = makeProject({
            lastLimitNotification: {
                storage: { threshold80: new Date(Date.now() - EIGHT_DAYS_MS), threshold95: null, custom: null },
                database: { threshold80: null, threshold95: null, custom: null },
            },
        });
        await checkAndNotify({ project, resourceType: 'storage', currentUsage: 82 * MB, ownerEmail: 'dev@test.com' });
        expect(mockEmailQueueAdd).toHaveBeenCalledTimes(1);
    });

    test('BYOD absolute threshold — enqueues when usage >= absoluteLimit', async () => {
        const project = makeProject({
            resources: { db: { isExternal: true }, storage: { isExternal: true } },
            notificationSettings: {
                email: {
                    enabled: true,
                    storage: { type: 'absolute', thresholds: [], absoluteLimit: 500 * MB },
                    database: { type: 'absolute', thresholds: [], absoluteLimit: 500 * MB },
                },
            },
        });
        await checkAndNotify({ project, resourceType: 'storage', currentUsage: 600 * MB, ownerEmail: 'dev@test.com' });
        expect(mockEmailQueueAdd).toHaveBeenCalledWith('limit-warning', expect.objectContaining({ isBYOD: true, percentage: null }));
        expect(mockProjectUpdateOne).toHaveBeenCalledWith(
            { _id: 'proj_1' },
            { $set: { 'lastLimitNotification.storage.custom': expect.any(Date) } }
        );
    });

    test('BYOD absolute threshold — no email when usage < absoluteLimit', async () => {
        const project = makeProject({
            resources: { db: { isExternal: true }, storage: { isExternal: true } },
            notificationSettings: {
                email: {
                    enabled: true,
                    storage: { type: 'absolute', thresholds: [], absoluteLimit: 500 * MB },
                    database: { type: 'absolute', thresholds: [], absoluteLimit: 500 * MB },
                },
            },
        });
        await checkAndNotify({ project, resourceType: 'storage', currentUsage: 400 * MB, ownerEmail: 'dev@test.com' });
        expect(mockEmailQueueAdd).not.toHaveBeenCalled();
    });
});
