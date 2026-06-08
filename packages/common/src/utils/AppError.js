/**
 * Centralized Error class for urBackend.
 * Ensures consistent error structure: { success: false, data: {}, message: "" }
 */
class AppError extends Error {
  constructor(statusCode, message, error = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.error = error || (statusCode >= 500 ? "Internal Server Error" : "Error");
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
