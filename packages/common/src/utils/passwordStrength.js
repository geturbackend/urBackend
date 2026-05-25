const zxcvbn = require("zxcvbn");

const MIN_SCORE = 2;
const WEAK_PASSWORD_MESSAGE =
  "Password is too weak. Try adding numbers, symbols, or more characters.";

/**
 * Validates password strength using zxcvbn.
 * @param {string} password
 * @returns {{ message: string } | null} 
 */
function validatePasswordStrength(password) {
  if (typeof password !== "string" || password.length === 0) {
    return { message: WEAK_PASSWORD_MESSAGE };
  }

  const result = zxcvbn(password);

  if (result.score < MIN_SCORE) {
    return { message: WEAK_PASSWORD_MESSAGE };
  }

  return null;
}

module.exports = { validatePasswordStrength };
