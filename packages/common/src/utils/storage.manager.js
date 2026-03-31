const { storageRegistry } = require("./registry");
const { createClient } = require("@supabase/supabase-js");
const { decrypt } = require("./encryption");
const {
    S3Client,
    PutObjectCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command
} = require("@aws-sdk/client-s3");

const defaultSupabase = createClient(
    process.env.SUPABASE_URL || "https://dummy.supabase.co",
    process.env.SUPABASE_KEY || "dummy-key"
);

function createS3Adapter(config) {
    const s3Client = new S3Client({
        region: config.region || "auto",
        endpoint: config.endpoint,
        forcePathStyle: true,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        }
    });

    return {
        storage: {
            from: (bucketOverride) => {
                const activeBucket = bucketOverride || config.bucket;
                return {
                    upload: async (path, buffer, options = {}) => {
                        try {
                            const command = new PutObjectCommand({
                                Bucket: activeBucket,
                                Key: path,
                                Body: buffer,
                                ContentType: options.contentType
                            });
                            await s3Client.send(command);
                            return { data: { path }, error: null };
                        } catch (error) {
                            return { data: null, error };
                        }
                    },
                    remove: async (paths) => {
                        try {
                            const objects = paths.map(p => ({ Key: p }));
                            const command = new DeleteObjectsCommand({
                                Bucket: activeBucket,
                                Delete: { Objects: objects }
                            });
                            await s3Client.send(command);
                            return { data: paths, error: null };
                        } catch (error) {
                            return { data: null, error };
                        }
                    },
                    list: async (folder, options = {}) => {
                        try {
                            const prefix = folder ? (folder.endsWith('/') ? folder : folder + '/') : '';
                            let actualPrefix = prefix;
                            if (options.search) {
                                actualPrefix = prefix + options.search;
                            }
                            const command = new ListObjectsV2Command({
                                Bucket: activeBucket,
                                Prefix: actualPrefix,
                                MaxKeys: options.limit || 100
                            });
                            const result = await s3Client.send(command);
                            const files = (result.Contents || []).map(item => ({
                                name: item.Key.substring(prefix.length),
                                metadata: { size: item.Size },
                                created_at: item.LastModified
                            }));
                            return { data: files, error: null };
                        } catch (error) {
                            return { data: null, error };
                        }
                    },
                    getPublicUrl: (path) => {
                        if (config.publicUrlHost) {
                            const host = config.publicUrlHost.endsWith('/') ? config.publicUrlHost.slice(0, -1) : config.publicUrlHost;
                            return { data: { publicUrl: `${host}/${path}` } };
                        }
                        if (config.storageProvider === 'cloudflare_r2') {
                            // R2 - WARNING: PUBLIC ACCESS MUST BE ENABLED ON BUCKET SETTINGS
                            return { 
                                data: { 
                                    publicUrl: null,
                                    error: `Cloudflare R2 requires a "Public URL Host" or a custom domain. Current endpoint [${config.endpoint}] for bucket [${activeBucket}] might not be publicly accessible.` 
                                } 
                            };
                        }
                        return { data: { publicUrl: `https://${activeBucket}.s3.${config.region}.amazonaws.com/${path}` } };
                    }
                };
            }
        }
    };
}

async function getStorage(project) {
    if (!project?._id) {
        throw new Error("Project document is required");
    }

    const key = project._id.toString();

    // CACHE - REUSE EXISTING CLIENT
    if (storageRegistry.has(key)) {
        const entry = storageRegistry.get(key);
        entry.lastUsed = Date.now();
        return entry.client;
    }

    let client;

    // STORAGE - INTERNAL SUPABASE
    if (!project.resources?.storage?.isExternal) {
        client = defaultSupabase;
    } else {
        try {
            const decrypted = decrypt(project.resources.storage.config);
            const config = JSON.parse(decrypted);
            const provider = config.storageProvider || 'supabase';

            if (provider === 'supabase') {
                if (!config.storageUrl || !config.storageKey) {
                    throw new Error("Incomplete supabase storage config");
                }
                client = createClient(config.storageUrl, config.storageKey);
            } 
            else if (provider === 's3' || provider === 'cloudflare_r2') {
                if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
                    throw new Error("Incomplete S3/R2 storage config");
                }
                client = createS3Adapter(config);
            } else {
                throw new Error("Unknown storage provider: " + provider);
            }
        } catch (err) {
            console.error("Storage config error:", err);
            throw new Error("Invalid storage configuration");
        }
    }

    // REGISTRY - REGISTER CLIENT FOR POOLING
    storageRegistry.set(key, {
        client,
        lastUsed: Date.now(),
        isExternal: !!project.resources?.storage?.isExternal
    });

    return client;
}

module.exports = { getStorage };
