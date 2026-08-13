/**
 * Custom error class for application errors with status codes.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    if (errorCode) this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;