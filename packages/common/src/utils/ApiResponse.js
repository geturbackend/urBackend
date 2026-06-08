/**
 * Standard utility for consistent API success responses across the monorepo.
 * Ensures structure: { success: true, data: {}, message: "" }
 */
class ApiResponse {
  constructor(data = {}, message = "Success") {
    this.data = data;
    this.message = message;
    this.success = true;
  }

  /**
   * Sends a standardized success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   */
  send(res, statusCode = 200) {
    return res.status(statusCode).json({
      success: this.success,
      data: this.data,
      message: this.message
    });
  }
}

module.exports = ApiResponse;
