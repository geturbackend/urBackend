const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { connectDB, Developer } = require('@urbackend/common');
const authController = require('../apps/dashboard-api/src/controllers/auth.controller');

async function test() {
    await connectDB();
    console.log("Connected to DB");

    // Let's print out if developer model has pre hooks
    console.log("Developer hooks:", Object.keys(Developer.schema.paths));

    const req = {
        body: {
            email: 'test_signup_temp_unique@urbackend.com',
            password: 'password123',
            name: 'Test Name'
        }
    };

    const res = {
        cookie: (name, val, options) => {
            const maskedVal = typeof val === 'string' && val.length > 10 ? val.slice(0, 10) + '...' : val;
            console.log(`cookie set: ${name} = ${maskedVal}`);
        },
        status: (code) => {
            console.log(`status set: ${code}`);
            return res;
        },
        json: (data) => {
            const safeData = JSON.parse(JSON.stringify(data));
            if (safeData?.data?.user?.email) {
                const [u, d] = safeData.data.user.email.split('@');
                safeData.data.user.email = u.slice(0, 3) + '***@' + d;
            }
            if (safeData?.data?.user?.password) {
                safeData.data.user.password = '[REDACTED]';
            }
            if (safeData?.data?.token) {
                safeData.data.token = safeData.data.token.slice(0, 10) + '...';
            }
            console.log("JSON response:", safeData);
        }
    };

    const next = (err) => {
        console.error("Next called with error:", err);
    };

    try {
        // Remove the test user if they already exist
        await Developer.deleteOne({ email: req.body.email.toLowerCase() });
        
        await authController.register(req, res, next);
    } catch (e) {
        console.error("Caught exception:", e);
    } finally {
        await mongoose.connection.close();
    }
}

test().catch(console.error);
