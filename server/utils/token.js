const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate Access Token
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    }
  );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    }
  );
};

// Verify Access Token
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Generate Random Token
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Refresh Token Cookie Options
const refreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: true,          // HTTPS only
  sameSite: "none",      // Required for Vercel <-> Render
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
  refreshTokenCookieOptions,
};