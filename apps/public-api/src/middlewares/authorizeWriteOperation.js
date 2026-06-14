const { AppError } = require('@urbackend/common');
const { getConnection } = require('@urbackend/common');
const { getCompiledModel } = require('@urbackend/common');
const mongoose = require('mongoose');

module.exports = async (req, res, next) => {
    try {
        if (req.keyRole === 'secret') {
            return next();
        }

        const { collectionName, id } = req.params;
        const project = req.project;
        const collectionConfig = project.collections.find(c => c.name === collectionName);

        if (!collectionConfig) {
            return next(new AppError(404, 'The requested collection does not exist.', 'Collection not found'));
        }

        const rls = collectionConfig.rls || {};
        if (!rls.enabled) {
            return next(new AppError(403, 'Enable RLS for this collection to allow publishable-key writes.', 'Write blocked for publishable key'));
        }

        if (rls.requireAuthForWrite && !req.authUser?.userId) {
            return next(new AppError(401, 'Provide a valid user Bearer token for write operations.', 'Authentication required'));
        }

        const modeRaw = rls.mode || 'public-read';
        const allowedModes = new Set(['public-read', 'private', 'owner-write-only']);
        if (!allowedModes.has(modeRaw)) {
            return next(new AppError(403, 'The collection RLS mode is invalid.', 'Unsupported RLS mode'));
        }

        const ownerField = rls.ownerField || 'userId';

        if (!req.authUser?.userId) {
            return next(new AppError(401, 'Provide a valid user Bearer token for write operations.', 'Authentication required'));
        }

        const authUserId = String(req.authUser.userId);
        const method = String(req.method || '').toUpperCase();

        if (method === 'POST') {
            if (ownerField === '_id') {
                return next(new AppError(403, "RLS ownerField '_id' is not valid for insert ownership checks.", 'Insert denied'));
            }

            const bodyItems = Array.isArray(req.body) ? req.body : [req.body];

          if (bodyItems.length === 0) {
    return next(new AppError(400, 'Request body cannot be an empty array.', 'Invalid request body'));
}

for (let i = 0; i < bodyItems.length; i++) {
    const item = bodyItems[i];

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return next(new AppError(400, `Item at index ${i} must be a valid object`, 'Invalid request body'));
    }

    const incomingOwner = item?.[ownerField];

    if (incomingOwner === undefined || incomingOwner === null || incomingOwner === '') {
        item[ownerField] = authUserId;
        continue;
    }

    if (String(incomingOwner) !== authUserId) {
        return next(new AppError(403, `Item at index ${i} must have ${ownerField} equal to your user id`, 'RLS owner mismatch'));
    }
}

            return next();
        }

        if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return next(new AppError(400, 'The provided document ID is not valid.', 'Invalid ID format'));
            }

            req.rlsFilter = { [ownerField]: authUserId };

            if (method === 'PUT' || method === 'PATCH') {
                if (
                    req.body &&
                    Object.prototype.hasOwnProperty.call(req.body, ownerField) &&
                    String(req.body[ownerField]) !== authUserId
                ) {
                    return next(new AppError(403, `${ownerField} cannot be changed under RLS.`, 'Owner field immutable'));
                }
            }

            return next();
        }

        return next();
    } catch (err) {
        console.error('[authorizeWriteOperation] Unexpected error:', err);
        return next(new AppError(500, 'Internal Server Error'));
    }
};