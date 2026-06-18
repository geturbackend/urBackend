const { Worker } = require('bullmq');
const { PassThrough } = require('stream');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const {
    redis,
    exportQueue,
    emailQueue,
    Project,
    getConnection,
    getCompiledModel,
    getS3CompatibleStorage,
    getStorage,
    decrypt,
    getBucket
} = require('@urbackend/common');

// Maximum documents written per export.
// The cursor is queried for MAX_EXPORT_ROWS + 1 documents so we can
// distinguish a truncated result (collection has more documents than the cap)
// from an exact match (collection has exactly MAX_EXPORT_ROWS documents).
const MAX_EXPORT_ROWS = 100000;

/**
 * Write a chunk to a Writable stream and wait for the drain event if the
 * internal buffer is full. Honoring backpressure prevents unbounded memory
 * growth when disk or object-storage throughput is slower than Mongo cursor
 * throughput.
 *
 * @param {import('stream').Writable} stream
 * @param {string} chunk
 * @returns {Promise<void>}
 */
async function writeChunk(stream, chunk) {
    const canContinue = stream.write(chunk);
    if (!canContinue) {
        await new Promise((resolve) => stream.once('drain', resolve));
    }
}

const initExportWorker = () => {
    const worker = new Worker(exportQueue.name, async (job) => {
        const { projectId, collectionName, userId, email } = job.data;
        console.log(`[ExportWorker] Starting export for collection ${collectionName} in project ${projectId} requested by ${email}`);

        const project = await Project.findById(projectId).select(
            "name collections resources.db.isExternal resources.storage.isExternal +resources.storage.config.encrypted +resources.storage.config.iv +resources.storage.config.tag"
        );
        if (!project) throw new Error('Project not found');

        const col = project.collections.find(c => c.name === collectionName);
        if (!col) throw new Error(`Collection ${collectionName} not found`);

        const connection = await getConnection(projectId);
        const bucket = getBucket(project);
        const storagePath = `${projectId}/exports/${collectionName}_export_${Date.now()}.json`;

        let provider = 'supabase';
        if (project.resources?.storage?.isExternal) {
            try {
                const decrypted = decrypt(project.resources.storage.config);
                const config = JSON.parse(decrypted);
                provider = config.storageProvider || 'supabase';
            } catch (err) {
                console.error("[ExportWorker] Error decrypting storage config:", err);
            }
        }

        const client = await getStorage(project);

        console.log(`[ExportWorker] Preparing upload to storage (Provider: ${provider})...`);

        // wasTruncated is set when the collection contains more than MAX_EXPORT_ROWS
        // documents. The cursor is limited to MAX_EXPORT_ROWS + 1 so we can detect
        // truncation without a separate count query.
        let wasTruncated = false;

        if (provider === 'supabase') {
            const tempFilePath = path.join(os.tmpdir(), `export_${projectId}_${collectionName}_${Date.now()}.json`);
            const writeStream = fs.createWriteStream(tempFilePath);

            try {
                await writeChunk(writeStream, '{\n');
                const Model = getCompiledModel(connection, col, projectId, project.resources.db.isExternal);

                await writeChunk(writeStream, `  "${col.name}": [\n`);

                // Query one extra row to detect whether the result was capped.
                const cursor = Model.find().lean().limit(MAX_EXPORT_ROWS + 1).cursor();
                let first = true;
                let exportedCount = 0;

                // Wrap cursor iteration in try/finally to guarantee the cursor is
                // closed even when the loop exits early via break (truncation case).
                // An unclosed cursor holds a MongoDB server-side cursor open indefinitely.
                try {
                    for await (const doc of cursor) {
                        if (exportedCount >= MAX_EXPORT_ROWS) {
                            // We received the sentinel row; mark truncated and stop writing.
                            wasTruncated = true;
                            break;
                        }
                        exportedCount++;
                        if (!first) await writeChunk(writeStream, ',\n');
                        await writeChunk(writeStream, `    ${JSON.stringify(doc)}`);
                        first = false;
                    }
                } finally {
                    await cursor.close();
                }

                if (wasTruncated) {
                    console.warn(`[ExportWorker] Export truncated: collection exceeds the ${MAX_EXPORT_ROWS}-document cap`);
                }

                await writeChunk(writeStream, '\n  ]\n');
                await writeChunk(writeStream, '}\n');

                // Register the finish listener BEFORE calling end() to avoid a
                // race condition where the finish event fires before the promise
                // listener is attached, causing the promise to never resolve.
                const finishPromise = new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });
                writeStream.end();
                await finishPromise;

                console.log(`[ExportWorker] Temp file created, uploading...`);

                // Stream the file directly instead of reading it all into a Buffer.
                // readFileSync would load the entire export (potentially hundreds of MB)
                // into memory, negating the purpose of the temp-file strategy.
                const readStream = fs.createReadStream(tempFilePath);
                const { error } = await client.storage.from(bucket).upload(storagePath, readStream, {
                    contentType: 'application/json'
                });

                if (error) throw error;
            } finally {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            }

        } else if (provider === 's3' || provider === 'cloudflare_r2') {
            const passThrough = new PassThrough();

            // Start the upload promise in parallel using the getStorage client
            const uploadPromise = client.storage.from(bucket).upload(storagePath, passThrough, {
                contentType: 'application/json'
            });

            try {
                await writeChunk(passThrough, '{\n');

                const Model = getCompiledModel(connection, col, projectId, project.resources.db.isExternal);

                await writeChunk(passThrough, `  "${col.name}": [\n`);

                // Query one extra row to detect whether the result was capped.
                const cursor = Model.find().lean().limit(MAX_EXPORT_ROWS + 1).cursor();
                let first = true;
                let exportedCount = 0;

                // Wrap cursor iteration in try/finally to guarantee the cursor is
                // closed even when the loop exits early via break (truncation case).
                try {
                    for await (const doc of cursor) {
                        if (exportedCount >= MAX_EXPORT_ROWS) {
                            wasTruncated = true;
                            break;
                        }
                        exportedCount++;
                        if (!first) await writeChunk(passThrough, ',\n');
                        await writeChunk(passThrough, `    ${JSON.stringify(doc)}`);
                        first = false;
                    }
                } finally {
                    await cursor.close();
                }

                if (wasTruncated) {
                    console.warn(`[ExportWorker] Export truncated: collection exceeds the ${MAX_EXPORT_ROWS}-document cap`);
                }

                await writeChunk(passThrough, '\n  ]\n');
                await writeChunk(passThrough, '}\n');
                passThrough.end();

                console.log(`[ExportWorker] Database stream ended. Awaiting final storage upload...`);
                const { error } = await uploadPromise;
                if (error) throw error;
            } catch (error) {
                passThrough.destroy(error);
                throw error;
            }
        } else {
            throw new Error(`Unknown storage provider: ${provider}`);
        }

        let downloadUrl;
        if (provider === 'supabase') {
            const { data, error } = await client.storage.from(bucket).createSignedUrl(storagePath, 86400);
            if (error) throw error;
            downloadUrl = data?.signedUrl;
        } else {
            const { s3Client } = await getS3CompatibleStorage(project);
            const command = new GetObjectCommand({ Bucket: bucket, Key: storagePath });
            downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 86400 });
        }

        // Pass wasTruncated to the email handler so the recipient knows
        // the file contains a capped subset of the collection.
        await emailQueue.add('send-export-email', {
            email,
            downloadUrl,
            projectName: project.name,
            wasTruncated,
            maxExportRows: MAX_EXPORT_ROWS
        });
        console.log(`[ExportWorker] Export completed! Email queued for ${email}${wasTruncated ? ' (truncated)' : ''}`);
    }, { connection: redis, concurrency: 2 });

    worker.on('completed', (job) => {
        console.log(`[ExportWorker] Job ${job.id} for project ${job.data.projectId} completed.`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[ExportWorker] Job ${job?.id} for project ${job?.data?.projectId} failed:`, err.message);
    });

    return worker;
};

module.exports = { initExportWorker };
