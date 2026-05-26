const crypto = require('crypto');
const axios = require('axios');

/**
 * Forwards a request to the internal Python microservice with HMAC-SHA256 signature.
 * @param {string} path - The path on the Python service (e.g., "/ai/query-builder")
 * @param {object} payload - The JSON payload to send
 * @returns {Promise<any>} The response data from Python service
 */
const forwardToPythonService = async (path, payload) => {
    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const secret = process.env.INTERNAL_SECRET;

    if (!secret) {
        throw new Error("INTERNAL_SECRET is not defined in environment");
    }

    const payloadString = JSON.stringify(payload);
    const timestamp = Date.now().toString();

    // Generate HMAC-SHA256 signature
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payloadString}`)
        .digest('hex');

    try {
        const response = await axios.post(`${pythonUrl}${path}`, payloadString, {
            headers: {
                'X-Internal-Signature': signature,
                'X-Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error communicating with Python Service:", error.response?.data || error.message);
        throw error;
    }
};

module.exports = { forwardToPythonService };
