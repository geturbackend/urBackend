const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const { validateEnv } = require('@urbackend/common');

if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const rateLimit = require('express-rate-limit');
const app = express();
app.set('trust proxy', 1);
const {garbageCollect, storageGarbageCollect, getPublicIp, standardizeApiResponse} = require('@urbackend/common');
const { capture } = require('@kiroo/sdk');

const { emailQueue, authEmailQueue } = require('@urbackend/common');

const dashboardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: "Dashboard usage limit exceeded. Slow down!" },
    skip: (req) => process.env.NODE_ENV === 'development',
});

const whitelist = (function() {
    // Default allowed origins
    const allowed = [process.env.FRONTEND_URL];
    
    // Support comma-separated list of origins in .env
    if (process.env.ALLOWED_ORIGINS) {
        const extraOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
        allowed.push(...extraOrigins);
    }

    if (process.env.NODE_ENV === 'development') {
        allowed.push('http://localhost:5173');
        allowed.push('http://localhost:3000');
    }

    // Filter out duplicates and empty values
    const uniqueAllowed = [...new Set(allowed.filter(Boolean))];

    return {
        get: () => uniqueAllowed
    };
})()

app.use(cors({
    origin: whitelist.get(),
    credentials: true,
}));

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ extended: true }));
app.use(standardizeApiResponse);

app.use(cookieParser());

const csrfProtection = csurf({ 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    } 
});

app.use((req, res, next) => {
    // Exclude Razorpay webhook from CSRF protection since it's an external POST request
    if (req.path === '/api/billing/webhook') {
        return next();
    }
    csrfProtection(req, res, next);
});


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



const authRoute = require('./routes/auth');
const projectRoute = require('./routes/projects');
const releaseRoute = require('./routes/releases');
const webhookRoute = require('./routes/webhooks');
const analyticsRoute = require('./routes/analytics');
const billingRoute = require('./routes/billing');
const eventsRoute = require('./routes/events');
const adminMetricsRoute = require('./routes/admin.metrics');
const aiRoute = require('./routes/ai.routes');
const invitationsRoute = require('./routes/invitations');

app.use('/api/auth', authRoute); 
app.use('/api/projects', dashboardLimiter, projectRoute);
app.use('/api/projects/:projectId/ai', dashboardLimiter, aiRoute);
app.use('/api/projects', dashboardLimiter, webhookRoute);
app.use('/api/releases', releaseRoute);
app.use('/api/analytics', dashboardLimiter, analyticsRoute);
app.use('/api/billing', billingRoute);
app.use('/api/events', dashboardLimiter, eventsRoute);
app.use('/api/admin/metrics', dashboardLimiter, adminMetricsRoute);
app.use('/api/invitations', dashboardLimiter, invitationsRoute);



app.get('/api/server-ip', async (req, res) => {
    const ip = await getPublicIp();
    res.json({ ip });
});

app.get('/', (req, res) => {
    res.status(200).json({ status: "success", message: "urBackend API is running 🚀" })
});

// Global Error Handler
app.use((err, req, res, next) => {
    // CSRF Error Handling
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            success: false,
            error: "Invalid CSRF token",
            message: "The form has expired or the CSRF token is invalid. Please refresh the page and try again."
        });
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: "Invalid JSON format",
            message: "Check your request body syntax. Stray characters outside the JSON object are not allowed."
        });
    }

    if (err.isOperational && err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.error || "Error",
            message: err.message
        });
    }

    console.error("🔥 Unhandled Server Error:", err.stack);
    res.status(500).json({
        success: false,
        error: "Something went wrong!",
        message: "Internal server error"
    });
});

app.use((req, res) => {
    const id = res.get("X-Kiroo-Replay-ID");
    res.json({error: "Not Found", replayId: id})   
})
if (process.env.NODE_ENV !== 'test') {

    const PORT = process.env.PORT || 1234;

    const { connectDB } = require('@urbackend/common');

    let shuttingDown = false;
    let server;

    // SHUTDOWN
    const gracefulShutdown = async (err = null) => {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log('🛑 SIGTERM/SIGINT/Fatal Error received. Shutting down gracefully...');

        if (err) {
            console.error('Fatal Error causing shutdown:', err);
        }

        if (server) {
            server.close(async () => {
                console.log('✅ HTTP server closed.');
                try {
                    await mongoose.connection.close(false);
                    console.log('✅ MongoDB connection closed.');
                    process.exit(err ? 1 : 0);
                } catch (dbErr) {
                    console.error('❌ Error closing MongoDB connection:', dbErr);
                    process.exit(1);
                }
            });
        } else {
            try {
                await mongoose.connection.close(false);
                process.exit(err ? 1 : 0);
            } catch (dbErr) {
                process.exit(1);
            }
        }

        // Force close after 10s
        setTimeout(() => {
            console.error('Force shutting down...');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown());
    process.on('SIGINT', () => gracefulShutdown());

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        gracefulShutdown(reason);
    });

    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        gracefulShutdown(err);
    });

    // Start DB & Server
    connectDB();

    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Testing
module.exports = app;
