const axios = require('axios');
const crypto = require('crypto');

const run = async () => {
    const timestamp = Date.now().toString();
    const payload = JSON.stringify({ prompt: "test", schema_fields: [] });
    
    const secret = process.env.TEST_SECRET || process.env.INTERNAL_SECRET;
    const apiUrl = process.env.AI_API_URL || 'http://127.0.0.1:8000/ai/query-builder';
    
    if (!secret) {
        console.error("Missing TEST_SECRET or INTERNAL_SECRET in environment variables.");
        process.exit(1);
    }
    
    const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');

    try {
        const res = await axios.post(apiUrl, payload, {
            headers: {
                'X-Internal-Signature': signature,
                'X-Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });
        console.log("Success:", res.data);
    } catch (e) {
        if (e.response) {
            console.log("Error status:", e.response.status);
            console.log("Error data:", e.response.data);
        } else {
            console.log("No response:", e.message);
        }
    }
};

run();
