const crypto = require('crypto');

function generateApiKey(prefix = 'ub_key_') {

    // OS level cryptographic randomnesss
    const bytes = crypto.randomBytes(32)
    // console.log(bytes);

    const key = bytes.toString("base64url");
    // console.log(key)

    return `${prefix}${key}`

}

//api hashing
function hashApiKey(apikey) {
    return crypto
        .createHash("sha256")
        .update(apikey)
        .digest("hex");
}

module.exports = { generateApiKey, hashApiKey }