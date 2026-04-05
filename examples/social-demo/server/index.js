import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const API_URL = process.env.API_URL || 'http://localhost:1235';
const API_KEY = process.env.API_KEY || 'YOUR_SECRET_API_KEY';

// Enable CORS
app.use(cors());

console.log('🔧 Server Configuration:');
console.log('  API URL:', API_URL);
console.log('  API Key:', API_KEY ? 'Configured ✓' : 'MISSING ✗');

// Proxy middleware - streams requests directly to backend
app.use('/api/proxy', createProxyMiddleware({
    target: `${API_URL}/api`,
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req, res) => {
            // Add API key header before sending to backend
            if (API_KEY) {
                proxyReq.setHeader('x-api-key', API_KEY);
            }
            console.log(`\n📤 [${req.method}] ${req.originalUrl}`);
            console.log(`   → Forwarding to: ${API_URL}${req.originalUrl.replace('/api/proxy', '/api')}`);
        },
        error: (err, req, res) => {
            console.error(`❌ Proxy Error:`, err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Proxy Error', message: err.message });
            }
        }
    }
}));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Proxy Server is running ✓', 
        target: API_URL,
        apiKey: API_KEY ? 'Configured ✓' : 'MISSING ✗',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Social Demo Proxy Server running on http://localhost:${PORT}`);
    console.log(`   Forwarding /api/proxy/* -> ${API_URL}/api/*`);
    console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
