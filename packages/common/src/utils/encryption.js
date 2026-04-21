const crypto = require("crypto");

const algorithm = "aes-256-gcm";
const ivLength = 16;

function encrypt(plainText) {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY missing in .env");

    const iv = crypto.randomBytes(ivLength);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString("hex"),
        encrypted: encrypted,
        tag: tag.toString("hex")
    };
}

function decrypt(encryptedData) {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    try {
        const iv = Buffer.from(encryptedData.iv, "hex");
        const tag = Buffer.from(encryptedData.tag, "hex");
        const encryptedText = Buffer.from(encryptedData.encrypted, "hex");

        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedText, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Decryption failed: Data tampered or wrong key.");
        return null;
    }
}


module.exports = { encrypt, decrypt };