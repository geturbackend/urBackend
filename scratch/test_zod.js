const { loginSchema } = require('@urbackend/common');
const z = require('zod');

const req = {
    body: {
        email: 'test_signup_temp_unique@urbackend.com',
        password: 'password123',
        name: 'Test Name'
    }
};

try {
    const res = loginSchema.parse(req.body);
    console.log("direct parse success:", res);
} catch (e) {
    console.log("direct parse failed:", e);
}
