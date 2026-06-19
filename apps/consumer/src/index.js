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

let port = process.env.NODE_ENV === 'production'
    ? (Number(process.env.PORT) || 3000)
    : (Number(process.env.CONSUMER_PORT) || 1237);

if (port < 1 || port > 65535 || isNaN(port)) {
    console.warn(`[CONSUMER] Invalid port ${port} detected, defaulting to 1237`);
    port = 1237;
}
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
