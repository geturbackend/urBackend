const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../../../.env') });

const express = require('express');

const { validateEnv } = require('@urbackend/common');

if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}

const { initExportWorker } = require('./workers/export.worker');

const { connectDB } = require('@urbackend/common');

const app = express();
app.get('/', (_req, res) => {
    res.status(200).send('consumer worker running');
});

const port = Number(process.env.PORT) || 3000;
let worker;
let server;

(async () => {
    try {
        await connectDB();

        worker = initExportWorker();

        server = app.listen(port, '0.0.0.0', () => {
            console.log(`[CONSUMER] HTTP health server listening on port ${port}`);
            console.log('[CONSUMER] Export worker started and listening for jobs...');
        });

        const shutdown = async () => {
            console.log('Shutting down worker...');
            await worker.close();
            if (server) {
                await new Promise((resolve) => server.close(resolve));
            }
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (err) {
        console.error('Failed to start worker:', err);
        process.exit(1);
    }
})();
