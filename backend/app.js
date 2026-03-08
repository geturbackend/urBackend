const express = require('express');
const app = express();
const healthRoutes = require('./routes/health');

app.use(express.json());

// Health Check Route
app.use('/api', healthRoutes);

// ... existing routes

module.exports = app;