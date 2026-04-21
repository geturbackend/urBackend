const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const {validateEnv} = require('@urbackend/common');

if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const app = express();
app.set('trust proxy', 1);
const { garbageCollect, storageGarbageCollect, getPublicIp, standardizeApiResponse } = require('@urbackend/common');
const { capture } = require('@kiroo/sdk');


// Initialize Queue Workers
const {emailQueue} = require('@urbackend/common');
const {authEmailQueue} = require('@urbackend/common');
const {initWebhookWorker} = require('@urbackend/common');
const {initAuthEmailWorker} = require('@urbackend/common');

// Initialize webhook worker
if (process.env.NODE_ENV !== 'test') {
    initWebhookWorker();
    initAuthEmailWorker();
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(standardizeApiResponse);
app.use(cors());
app.use(cookieParser());


if (process.env.NODE_ENV !== 'test') {
    garbageCollect();
    storageGarbageCollect();
}

app.use(capture({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  bucket: process.env.SUPABASE_BUCKET,
  sampleRate: 0
}));



// LOGGING
const { limiter, logger } = require('./middlewares/api_usage');

// Route Imports
const dataRoute = require('./routes/data');
const userAuthRoute = require('./routes/userAuth');
const storageRoute = require('./routes/storage');
const schemaRoute = require('./routes/schemas');
const mailRoute = require('./routes/mail');
const healthRoute = require('./routes/health');

// ROUTES SETUP 
app.use('/api/userAuth', limiter, logger, userAuthRoute);

const projectCorsPreflight = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
};

app.use('/api/data', projectCorsPreflight, limiter, logger, dataRoute);
app.use('/api/schemas', projectCorsPreflight, limiter, logger, schemaRoute);
app.use('/api/storage', projectCorsPreflight, limiter, logger, storageRoute);
app.use('/api/mail', projectCorsPreflight, limiter, logger, mailRoute);
app.use('/api/health', limiter, logger, healthRoute);

app.get('/api/server-ip', async (req, res) => {
    const ip = await getPublicIp();
    res.json({ ip });
});

// Test Route
app.get('/', (req, res) => {
    res.status(200).json({ status: "success", message: "urBackend API is running 🚀" })
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: "Invalid JSON format",
            message: "Check your request body syntax. Stray characters outside the JSON object are not allowed."
        });
    }

    console.error("🔥 Unhandled Error:", err.stack);
    res.status(500).json({
        error: "Something went wrong!",
        message: err.message
    });
});

app.use((req, res) => {
    const id = res.get("X-Kiroo-Replay-ID");
    res.json({error: "Not Found", replayId: id})   
})
// INITIALIZATION
if (process.env.NODE_ENV !== 'test') {

    const PORT = process.env.USER_PORT || 1235;

    const { connectDB } = require('@urbackend/common');

    // Start DB & Server
    connectDB();

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // SHUTDOWN
    const gracefulShutdown = async () => {
        console.log('🛑 SIGTERM/SIGINT received. Shutting down gracefully...');

        server.close(async () => {
            console.log('✅ HTTP server closed.');
            try {
                await mongoose.connection.close(false);
                console.log('✅ MongoDB connection closed.');
                process.exit(0);
            } catch (err) {
                console.error('❌ Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });

        // Force close after 10s
        setTimeout(() => {
            console.error('Force shutting down...');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}

// Export for Testing
module.exports = app;
