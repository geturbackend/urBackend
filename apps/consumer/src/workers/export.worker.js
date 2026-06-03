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

        if (provider === 'supabase') {
            const tempFilePath = path.join(os.tmpdir(), `export_${projectId}_${collectionName}_${Date.now()}.json`);
            const writeStream = fs.createWriteStream(tempFilePath);
            
            try {
                writeStream.write('{\n');
                const Model = getCompiledModel(connection, col, projectId, project.resources.db.isExternal);
                
                writeStream.write(`  "${col.name}": [\n`);
                
                const cursor = Model.find().lean().cursor();
                let first = true;
                
                for await (const doc of cursor) {
                    if (!first) writeStream.write(',\n');
                    writeStream.write(`    ${JSON.stringify(doc)}`);
                    first = false;
                }
                
                writeStream.write('\n  ]\n');
                writeStream.write('}\n');
                writeStream.end();

                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                console.log(`[ExportWorker] Temp file created, uploading...`);
                const fileBuffer = fs.readFileSync(tempFilePath);
                
                const { error } = await client.storage.from(bucket).upload(storagePath, fileBuffer, {
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
                passThrough.write('{\n');
                
                const Model = getCompiledModel(connection, col, projectId, project.resources.db.isExternal);
                
                passThrough.write(`  "${col.name}": [\n`);
                
                const cursor = Model.find().lean().cursor();
                let first = true;
                
                for await (const doc of cursor) {
                    if (!first) passThrough.write(',\n');
                    passThrough.write(`    ${JSON.stringify(doc)}`);
                    first = false;
                }
                
                passThrough.write('\n  ]\n');
                
                passThrough.write('}\n');
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

        // queue the email to be sent to the user
        await emailQueue.add('send-export-email', { email, downloadUrl, projectName: project.name });
        console.log(`[ExportWorker] Export completed! Email queued for ${email}`);
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
