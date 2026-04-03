'use strict';

const { getConnection } = require('./connection.manager');

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Returns the current external (BYOD) database size in bytes.
 * Uses db.stats() over the project's external connection.
 * Results are cached on the Project document for CACHE_TTL_MS to avoid excessive queries.
 *
 * For internal (managed) databases the function returns the project.databaseUsed value directly.
 *
 * @param {import('mongoose').Document} project - Full Mongoose Project document (not lean)
 * @returns {Promise<number>} Database size in bytes
 */
async function calculateExternalDbSize(project) {
    const isExternal = project.resources?.db?.isExternal;

    if (!isExternal) {
        // Managed DB: use the tracked counter
        return project.databaseUsed || 0;
    }

    // Check cached value first
    const cached = project.cachedUsageStats?.database;
    if (cached && cached.lastCalculated) {
        const age = Date.now() - new Date(cached.lastCalculated).getTime();
        if (age < CACHE_TTL_MS && typeof cached.size === 'number') {
            return cached.size;
        }
    }

    // Fetch live stats from external connection
    try {
        const connection = await getConnection(project._id);
        const stats = await connection.db.stats();
        const sizeBytes = stats.dataSize || 0;

        // Persist cache (fire-and-forget; don't let failures block the caller)
        project.updateOne({
            'cachedUsageStats.database': {
                size: sizeBytes,
                lastCalculated: new Date(),
            },
        }).catch((err) => {
            console.error('[calculateExternalDbSize] Failed to update cache:', err.message);
        });

        return sizeBytes;
    } catch (err) {
        console.error('[calculateExternalDbSize] Failed to fetch external DB stats:', err.message);
        // Graceful degradation: return stale cached value if available
        return cached?.size ?? 0;
    }
}

module.exports = { calculateExternalDbSize };
