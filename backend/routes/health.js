const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
// Assuming redis client is available via a global/config file or direct import
// Adjust the import based on project structure
const { redisClient } = require('../config/redis'); 

router.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  let redisStatus = 'disconnected';
  try {
    if (redisClient && redisClient.isOpen) {
      redisStatus = 'connected';
    }
  } catch (err) {
    redisStatus = 'disconnected';
  }

  const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';

  const response = {
    status: isHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  };

  res.status(isHealthy ? 200 : 503).json(response);
});

module.exports = router;