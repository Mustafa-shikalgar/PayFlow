const AppError = require('../utils/AppError');

/**
 * Handle 404 for unknown routes.
 */
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

/**
 * Normalize a thrown value into a usable Error.
 *
 * IMPORTANT: the Razorpay SDK does NOT throw a real Error on API failures.
 * Its `normalizeError` does `throw { statusCode, error }` — a plain object with
 * no `.message` and no `.stack`. Previously this object reached the error
 * handler, which logged `❌ undefined` and responded with the raw statusCode
 * (e.g. 401). A payment-gateway 401 is a *server* credential problem and must
 * NOT be reported to the client as an expired user access token.
 */
const normalizeError = (err) => {
  if (err instanceof Error) return err;

  // Plain object throws (e.g. Razorpay SDK → { statusCode, error }).
  if (err && typeof err === 'object') {
    const description =
      (err.error && (err.error.description || err.error.reason || err.error.message)) || undefined;

    const statusCode =
      Number.isInteger(err.statusCode) &&
        err.statusCode >= 400 &&
        err.statusCode < 600
        ? err.statusCode
        : undefined;

    const error = new AppError(
      description || 'Unexpected error from an external service.',
      statusCode && statusCode !== 401 ? statusCode : 500
    );
    error.raw = err; // attach the original payload for debugging (never secrets)
    return error;
  }

  // Anything else (string, number, null, undefined)
  return new AppError('An unexpected error occurred.', 500);
};

/**
 * Global error handler.
 */
const errorHandler = (err, req, res, next) => {
  let error = normalizeError(err);
  error.message = error.message;

  // Log error (never log secrets; Razorpay 401 confirms a server-side config issue)
  console.error(`❌ [${req.method} ${req.originalUrl}] ${error.stack || error.message}`);

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = `Resource not found with id of ${error.value}`;
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map((val) => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
    error.errorCode = 'INVALID_TOKEN';
  }
  if (error.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again.', 401);
    error.errorCode = 'TOKEN_EXPIRED';
  }

  // Multer errors
  if (error.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max size is 2MB.' : error.message;
    error = new AppError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    code: error.errorCode || null,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
};

module.exports = { notFound, errorHandler };