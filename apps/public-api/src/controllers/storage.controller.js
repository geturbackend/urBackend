const { getStorage, getPresignedUploadUrl, verifyUploadedFile, Project, isProjectStorageExternal, getBucket, redis } = require("@urbackend/common");
const { randomUUID } = require("crypto");
const { getMonthKey, getEndOfMonthTtlSeconds, incrWithTtlAtomic } = require("../utils/usageCounter");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SAFETY_MAX_BYTES = 100 * 1024 * 1024; // 100MB safety ceiling for internal storage



const updateMonthlyUsageCounter = (projectId, metricName, value) => {
    if (!value || value <= 0) return;
    const now = new Date();
    const monthKey = getMonthKey(now);
    const ttlSeconds = getEndOfMonthTtlSeconds(now);
    const key = `project:usage:${metricName}:${projectId}:${monthKey}`;
    incrWithTtlAtomic(redis, key, ttlSeconds, value).catch(() => {});
};


// Upload File

module.exports.uploadFile = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        if (file.size > MAX_FILE_SIZE) {
            return res.status(413).json({ error: "File size exceeds limit." });
        }

        const project = req.project;
        const external = isProjectStorageExternal(project);
        const bucket = getBucket(project);

        // ATOMIC QUOTA RESERVATION
        if (!external) {
            const limits = req.planLimits || {};
            // Use explicit type checks instead of || to distinguish between undefined and 0
            let effectiveLimit;
            if (typeof limits.storageBytes === 'number') {
                effectiveLimit = limits.storageBytes;
            } else if (typeof project.storageLimit === 'number') {
                effectiveLimit = project.storageLimit;
            } else {
                effectiveLimit = 20 * 1024 * 1024;
            }

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
                    return res.status(403).json({ error: "Storage limit exceeded. Please upgrade your plan or delete some files." });
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
                    return res.status(403).json({ error: "Storage limit exceeded. Please upgrade your plan or delete some files." });
                }
            }
        }

        const supabase = await getStorage(project);

        const safeName = file.originalname.replace(/\s+/g, "_");
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

        return res.status(201).json({
            message: "File uploaded successfully",
            url: publicUrlData.publicUrl,
            path: filePath,
            provider: external ? "external" : "internal"
        });
    } catch (err) {
        return res.status(500).json({
            error: "File upload failed",
            details:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined
        });
    }
};

/**
 * Delete File
 */
module.exports.deleteFile = async (req, res) => {
    try {
        const { path } = req.body;
        if (!path) {
            return res.status(400).json({ error: "File path is required." });
        }

        const project = req.project;
        const external = isProjectStorageExternal(project);
        const bucket = getBucket(project);

        if (!path.startsWith(`${project._id}/`) || path.split('/').includes('..')) {
            return res.status(403).json({ error: "Access denied." });
        }

        const supabase = await getStorage(project);

        // Fetch metadata before delete so deleted-byte metrics work for both internal and external providers.
        let fileSize = 0;
        try {
            const rootPrefix = path.split("/")[0];
            const nestedPath = path.split("/").slice(1).join("/");
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
            .remove([path]);

        if (deleteError) throw deleteError;

        if (!external && fileSize > 0) {
            await Project.updateOne(
                { _id: project._id },
                { $inc: { storageUsed: -fileSize } }
            );
        }

        updateMonthlyUsageCounter(project._id, "storage:deletedBytes", fileSize);

        return res.json({ message: "File deleted successfully" });
    } catch (err) {
        return res.status(500).json({
            error: "File deletion failed",
            details:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined
        });
    }
};

module.exports.deleteAllFiles = async (req, res) => {
    try {
        const project = req.project; // assuming middleware attaches project
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
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

        res.json({
            success: true,
            deleted: deletedCount,
            provider: isProjectStorageExternal(project) ? "external" : "internal"
        });

    } catch (err) {
        res.status(500).json({
            error: "Failed to delete files",
            details:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined
        });
    }
};


// REQUEST UPLOAD - generates presigned URL for direct browser upload
module.exports.requestUpload = async (req, res) => {
    try {
        const { filename, contentType, size } = req.body;

        if (!filename || !contentType || !size)
            return res.status(400).json({ error: "filename, contentType, and size are required." });

        if (size > MAX_FILE_SIZE)
            return res.status(413).json({ error: "File size exceeds limit." });

        const project = req.project;
        const external = isProjectStorageExternal(project);

        // just peek at quota — don't charge yet, upload hasn't happened
        if (!external) {
            if (project.storageUsed + size > project.storageLimit)
                return res.status(403).json({ error: "Internal storage limit exceeded." });
        }

        const safeName = filename.replace(/\s+/g, "_");
        const filePath = `${project._id}/${randomUUID()}_${safeName}`;

        const { signedUrl, token } = await getPresignedUploadUrl(project, filePath, contentType);

        return res.status(200).json({ signedUrl, token, filePath });
    } catch (err) {
        return res.status(500).json({
            error: "Could not generate upload URL",
            details: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
};

// CONFIRM UPLOAD - verifies file landed on cloud, then charges quota
module.exports.confirmUpload = async (req, res) => {
    try {
        const { filePath, size } = req.body;

        if (!filePath || !size)
            return res.status(400).json({ error: "filePath and size are required." });

        const project = req.project;
        const external = isProjectStorageExternal(project);

        // make sure client isn't confirming someone else's file
        if (!filePath.startsWith(`${project._id}/`) || filePath.includes(".."))
            return res.status(403).json({ error: "Access denied." });

        // verify file actually exists on cloud before touching quota
        await verifyUploadedFile(project, filePath, size);

        // now it's safe to charge quota
        if (!external) {
            const result = await Project.updateOne(
                {
                    _id: project._id,
                    $expr: { $lte: [{ $add: ["$storageUsed", size] }, "$storageLimit"] }
                },
                { $inc: { storageUsed: size } }
            );
            if (result.matchedCount === 0)
                return res.status(403).json({ error: "Internal storage limit exceeded." });
        }

        const supabase = await getStorage(project);
        const bucket = getBucket(project);
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

        return res.status(200).json({
            message: "Upload confirmed",
            url: publicUrlData.publicUrl,
            path: filePath,
            provider: external ? "external" : "internal"
        });
    } catch (err) {
        return res.status(500).json({
            error: "Upload confirmation failed",
            details: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
};
