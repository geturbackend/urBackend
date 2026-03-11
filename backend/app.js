const dotenv = require('dotenv');
dotenv.config();

const validateEnv = require('./utils/validateEnv');

if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const rateLimit = require('express-rate-limit');
const app = express();
app.set('trust proxy', 1);
const GC = require('./utils/GC');
const { getPublicIp } = require('./utils/network');

// Initialize Queue Workers
require('./queues/emailQueue');
require('./queues/authEmailQueue');

// Middleware (We apply admin options globally except where overridden via dynamic handling)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dashboardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: "Dashboard usage limit exceeded. Slow down!" },
    skip: (req) => process.env.NODE_ENV === 'development',
});

// FIX 3: Strict limiter for auth endpoints (login / register)
const { authLimiter } = require('./middleware/auth_limiter');


const adminWhitelist = ['https://urbackend.bitbros.in'];

// DEV LOCALHOST
if (process.env.NODE_ENV === 'development') {
    adminWhitelist.push('http://localhost:5173');
}

const adminCorsOptions = {
    origin: function (origin, callback) {
        const start = process.hrtime.bigint();

        const allowed = !origin || adminWhitelist.includes(origin);

        const end = process.hrtime.bigint();

        if (allowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS for Admin access'));
        }
    },
    credentials: true
};


if (process.env.NODE_ENV !== 'test') {
    GC.garbageCollect();
    GC.storageGarbageCollect();
}


// LOGGING
const { limiter, logger } = require('./middleware/api_usage');

// Route Imports
const authRoute = require('./routes/auth');
const projectRoute = require('./routes/projects');
const dataRoute = require('./routes/data');
const userAuthRoute = require('./routes/userAuth');
const storageRoute = require('./routes/storage');
const schemaRoute = require('./routes/schemas');
const releaseRoute = require('./routes/releases');

// ROUTES SETUP 
app.use('/api/auth', cors(adminCorsOptions), authRoute); // Developer Auth (general)
app.use('/api/projects', cors(adminCorsOptions), dashboardLimiter, projectRoute); // Project Mgmt
app.use('/api/userAuth', cors(adminCorsOptions), limiter, logger, userAuthRoute);
app.use('/api/releases', cors(adminCorsOptions), releaseRoute);

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
// INITIALIZATION
if (process.env.NODE_ENV !== 'test') {

    const PORT = process.env.PORT || 1234;

    const connectDB = async () => {
        try {
            await mongoose.connect(process.env.MONGO_URL);
            console.log("✅ MongoDB Connected");
        } catch (err) {
            console.error("❌ MongoDB Connection Error:", err);
            // Retry logic
            setTimeout(connectDB, 5000);
        }
    };

    // Runtime Errors
    mongoose.connection.on('error', (err) => {
        console.error("🔥 MongoDB Runtime Error:", err);
    });

    // Auto-Reconnect
    mongoose.connection.on('disconnected', () => {
        console.warn("⚠️ MongoDB Disconnected. Retrying...");
        connectDB();
    });

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