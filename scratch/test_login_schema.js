const { loginSchema } = require('@urbackend/common');
console.log("loginSchema:", loginSchema);
try {
    const data = loginSchema.parse({
        email: 'test_signup_temp_unique@urbackend.com',
        password: 'password123',
        name: 'Test Name'
    });
    console.log("parsed successfully:", data);
} catch (e) {
    console.error("error during parsing:", e);
}
