const requiredEnvVars = ["MONGO_URL", "PORT", "REDIS_URL"];

function validateEnv() {
  if (process.env.NODE_ENV === "test") return;
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }
}

module.exports = validateEnv;