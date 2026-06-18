const { getStorage, getPresignedUploadUrl, verifyUploadedFile, Project, isProjectStorageExternal, getBucket, redis, getMonthKey, getEndOfMonthTtlSeconds, incrWithTtlAtomic, AppError, ApiResponse } = require("@urbackend/common");
const { randomUUID } = require("crypto");
const path = require("path");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SAFETY_MAX_BYTES = 100 * 1024 * 1024; // 100MB safety ceiling for internal storage
const CONFIRM_UPLOAD_SIZE_TOLERANCE_BYTES = 64;

const getEffectiveStorageLimit = (project, req) => {
    const limits = req.planLimits || {};
    if (typeof limits.storageBytes === 'number') {
        return limits.storageBytes;
    }
    if (typeof project.storageLimit === 'number') {
        return project.storageLimit;
    }
    return 20 * 1024 * 1024;
};

const parsePositiveSize = (size) => {
    const numericSize = Number(size);
    if (!Number.isFinite(numericSize) || numericSize <= 0) {
        return null;
    }
    return numericSize;
};

const normalizeProjectPath = (projectId, inputPath) => {
    if (typeof inputPath !== 'string') {
        return null;
    }

    let decodedPath = inputPath;
    try {
        decodedPath = decodeURIComponent(inputPath);
    } catch {
        return null;
    }

    const normalizedPath = path.posix.normalize(decodedPath).replace(/^\/+/, '');
    const segments = normalizedPath.split('/').filter(Boolean);

    if (segments.length < 2) {
        return null;
    }

    if (segments[0] !== String(projectId)) {
        return null;
    }

    if (segments.some((segment) => segment === '.' || segment === '..')) {
        return null;
    }

    return normalizedPath;
};



const updateMonthlyUsageCounter = (projectId, metricName, value) => {
    if (!value || value <= 0) return;
    const now = new Date();
    const monthKey = getMonthKey(now);
    const ttlSeconds = getEndOfMonthTtlSeconds(now);
    const key = `project:usage:${metricName}:${projectId}:${monthKey}`;
    incrWithTtlAtomic(redis, key, ttlSeconds, value).catch(() => {});
};

const bestEffortDeleteUploadedObject = async (project, filePath) => {
    try {
        const supabase = await getStorage(project);
        const bucket = getBucket(project);
        await supabase.storage.from(bucket).remove([filePath]);
    } catch {
        // ignore cleanup failures; the primary response should still be returned
    }
};


// Upload File

module.exports.uploadFile = async (req, res, next) => {
    try {
        const file = req.file;
        if (!file) {
            return next(new AppError(400, "No file uploaded."));
        }

        if (file.size > MAX_FILE_SIZE) {
            return next(new AppError(413, "File size exceeds limit."));
        }

        const project = req.project;
        const external = isProjectStorageExternal(project);
        const bucket = getBucket(project);

        // ATOMIC QUOTA RESERVATION
        if (!external) {
            const effectiveLimit = getEffectiveStorageLimit(project, req);

            // For internal storage: honor -1 as unlimited but clamp to safety ceiling
            if (effectiveLimit === -1) {
                // Internal storage with -1: clamp to safety ceiling
                const result = await Project.updateOne(
                    {
                        _id: project._id,
                        $expr: { $lte: [{ $add: ["$storageUsed", file.size] }, SAFETY_MAX_BYTES] }
                    },
                    { $inc: { storageUsed: file.size } }
                );

                if (result.matchedCount === 0) {
                    return next(new AppError(403, "Storage limit exceeded. Please upgrade your plan or delete some files."));
                }
            } else {
                const result = await Project.updateOne(
                    {
                        _id: project._id,
                        $expr: { $lte: [{ $add: ["$storageUsed", file.size] }, effectiveLimit] }
                    },
                    { $inc: { storageUsed: file.size } }
                );

                if (result.matchedCount === 0) {
                    return next(new AppError(403, "Storage limit exceeded. Please upgrade your plan or delete some files."));
                }
            }
        }

        const supabase = await getStorage(project);

        const safeName = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/\.{2,}/g, "_")
        .substring(0, 100);
        const filePath = `${project._id}/${randomUUID()}_${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            // ROLLBACK QUOTA
            if (!external) {
                await Project.updateOne(
                    { _id: project._id },
                    { $inc: { storageUsed: -file.size } }
                );
            }
            throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        updateMonthlyUsageCounter(project._id, "storage:uploadedBytes", file.size);

        return new ApiResponse({
            url: publicUrlData.publicUrl,
            path: filePath,
            provider: external ? "external" : "internal"
        }, "File uploaded successfully").send(res, 201);
    } catch (err) {
        if (err instanceof AppError) return next(err);
        return next(new AppError(500, process.env.NODE_ENV === "development" ? (err.message || "File upload failed") : "File upload failed"));
    }
};

/**
 * Delete File
 */
module.exports.deleteFile = async (req, res, next) => {
    try {
        const { path } = req.body;
        if (!path) {
            return next(new AppError(400, "File path is required."));
        }

        const project = req.project;
        const external = isProjectStorageExternal(project);
        const bucket = getBucket(project);
        const normalizedPath = normalizeProjectPath(project._id, path);

        if (!normalizedPath) {
            return next(new AppError(403, "Access denied."));
        }

        const supabase = await getStorage(project);

        // Fetch metadata before delete so deleted-byte metrics work for both internal and external providers.
        let fileSize = 0;
        try {
            const rootPrefix = normalizedPath.split("/")[0];
            const nestedPath = normalizedPath.split("/").slice(1).join("/");
            const { data, error } = await supabase.storage
                .from(bucket)
                .list(rootPrefix, {
                    search: nestedPath,
                    limit: 1,
                });

            if (error) throw error;
            if (data?.length) {
                fileSize = Number(data[0].metadata?.size) || 0;
            }
        } catch {
            fileSize = 0;
        }

        const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([normalizedPath]);

        if (deleteError) throw deleteError;

        if (!external && fileSize > 0) {
            await Project.updateOne(
                { _id: project._id },
                { $inc: { storageUsed: -fileSize } }
            );
        }

        updateMonthlyUsageCounter(project._id, "storage:deletedBytes", fileSize);

        return new ApiResponse({}, "File deleted successfully").send(res, 200);
    } catch (err) {
        if (err instanceof AppError) return next(err);
        return next(new AppError(500, process.env.NODE_ENV === "development" ? (err.message || "File deletion failed") : "File deletion failed"));
    }
};

module.exports.deleteAllFiles = async (req, res, next) => {
    try {
        const project = req.project; // assuming middleware attaches project
        if (!project) {
            return next(new AppError(404, "Project not found"));
        }

        const supabase = await getStorage(project);
        const bucket = getBucket(project);

        let hasMore = true;
        let deletedCount = 0;

        while (hasMore) {
            const { data: files, error } = await supabase.storage
                .from(bucket)
                .list(project._id.toString(), { limit: 100 });

            if (error) throw error;

            if (!files || files.length === 0) {
                hasMore = false;
                break;
            }

            const paths = files.map(f => `${project._id}/${f.name}`);

            const { error: removeError } = await supabase.storage
                .from(bucket)
                .remove(paths);

            if (removeError) throw removeError;

            deletedCount += files.length;
        }

        // Reset usage only for internal storage
        if (!isProjectStorageExternal(project)) {
            await Project.updateOne(
                { _id: project._id },
                { $set: { storageUsed: 0 } }
            );
        }

        return new ApiResponse({
            deleted: deletedCount,
            provider: isProjectStorageExternal(project) ? "external" : "internal"
        }).send(res, 200);

    } catch (err) {
        if (err instanceof AppError) return next(err);
        return next(new AppError(500, process.env.NODE_ENV === "development" ? (err.message || "Failed to delete files") : "Failed to delete files"));
    }
};


// REQUEST UPLOAD - generates presigned URL for direct browser upload
module.exports.requestUpload = async (req, res, next) => {
    try {
        const { filename, contentType, size } = req.body;
        const numericSize = parsePositiveSize(size);

        if (!filename || !contentType || numericSize === null)
            return next(new AppError(400, "filename, contentType, and size are required."));

        if (numericSize > MAX_FILE_SIZE)
            return next(new AppError(413, "File size exceeds limit."));

        const project = req.project;
        const external = isProjectStorageExternal(project);
        const effectiveLimit = getEffectiveStorageLimit(project, req);

        // just peek at quota — don't charge yet, upload hasn't happened
        if (!external) {
            const quotaLimit = effectiveLimit === -1 ? SAFETY_MAX_BYTES : effectiveLimit;
            if (project.storageUsed + numericSize > quotaLimit)
                return next(new AppError(403, "Internal storage limit exceeded."));
        }

        const safeName = filename
         .replace(/[^a-zA-Z0-9._-]/g, "_")
         .replace(/\.{2,}/g, "_")
         .substring(0, 100);
        const filePath = `${project._id}/${randomUUID()}_${safeName}`;

        const { signedUrl, token } = await getPresignedUploadUrl(project, filePath, contentType, numericSize);

        return new ApiResponse({ signedUrl, token, filePath }).send(res, 200);
    } catch (err) {
        if (err instanceof AppError) return next(err);
        return next(new AppError(500, process.env.NODE_ENV === "development" ? (err.message || "Could not generate upload URL") : "Could not generate upload URL"));
    }
};

// CONFIRM UPLOAD - verifies file landed on cloud, then charges quota
module.exports.confirmUpload = async (req, res, next) => {
    try {
        const { filePath, size } = req.body;
        const declaredSize = parsePositiveSize(size);

        if (!filePath || declaredSize === null)
            return next(new AppError(400, "filePath and size are required."));

        const project = req.project;
        const external = isProjectStorageExternal(project);
        const normalizedPath = normalizeProjectPath(project._id, filePath);

        // make sure client isn't confirming someone else's file
        if (!normalizedPath)
            return next(new AppError(403, "Access denied."));

        // verify file actually exists on cloud before touching quota
        let actualSize;
        try {
            actualSize = await verifyUploadedFile(project, normalizedPath);
        } catch (err) {
            if (err?.message === "File not found after upload") {
                await bestEffortDeleteUploadedObject(project, normalizedPath);
                return next(new AppError(409, "Uploaded file is not visible yet. Please retry confirmation.", "UPLOAD_NOT_READY"));
            }
            throw err;
        }

        if (!Number.isFinite(actualSize) || actualSize <= 0) {
            await bestEffortDeleteUploadedObject(project, normalizedPath);
            return next(new AppError(500, process.env.NODE_ENV === "development" ? "Uploaded file size could not be determined" : "Upload confirmation failed"));
        }

        if (Math.abs(actualSize - declaredSize) > CONFIRM_UPLOAD_SIZE_TOLERANCE_BYTES) {
            await bestEffortDeleteUploadedObject(project, normalizedPath);
            return next(new AppError(400, "Declared file size does not match uploaded file size."));
        }

        // now it's safe to charge quota
        if (!external) {
            const result = await Project.updateOne(
                {
                    _id: project._id,
                    $or: [
                        { storageLimit: -1 },
                        { $expr: { $lte: [{ $add: ["$storageUsed", actualSize] }, "$storageLimit"] } }
                    ]
                },
                { $inc: { storageUsed: actualSize } }
            );
            if (result.matchedCount === 0) {
                await bestEffortDeleteUploadedObject(project, normalizedPath);
                return next(new AppError(403, "Internal storage limit exceeded."));
            }
        }

        updateMonthlyUsageCounter(project._id, "storage:uploadedBytes", actualSize);

        const supabase = await getStorage(project);
        const bucket = getBucket(project);
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);

        const response = {
            message: "Upload confirmed",
            path: normalizedPath,
            provider: external ? "external" : "internal"
        };

        if (publicUrlData?.publicUrl) {
            response.url = publicUrlData.publicUrl;
        } else {
            response.url = null;
            response.warning = publicUrlData?.error || "Upload confirmed, but a public URL is unavailable.";
        }

        return new ApiResponse(response, response.message).send(res, 200);
    } catch (err) {
        if (err instanceof AppError) return next(err);
        return next(new AppError(500, process.env.NODE_ENV === "development" ? (err.message || "Upload confirmation failed") : "Upload confirmation failed"));
    }
};
