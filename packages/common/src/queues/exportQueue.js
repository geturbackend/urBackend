const { Queue } = require('bullmq');
const connection = require('../config/redis');

const exportQueue = new Queue('export-queue', { connection });

module.exports = { exportQueue };