const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes - requires valid access token.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token provided', 401));
  }

  try {
    console.log("========== AUTH DEBUG ==========");
    console.log("Authorization Header:", req.headers.authorization);
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded Token:", decoded);

    const user = await User.findById(decoded.id);

    console.log("User Found:", user);

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    if (!user.isActive) {
      return next(new AppError("Account has been deactivated", 403));
    }

    req.user = user;
    next();
  } catch (err) {
    console.log("========== JWT ERROR ==========");
    console.log("Error Name:", err.name);
    console.log("Error Message:", err.message);

    return next(new AppError(err.message, 401));
  }
});

/**
 * Restrict routes to specific roles.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role ${req.user.role} is not authorized to access this route`, 403));
    }
    next();
  };
};

module.exports = { protect, authorize };