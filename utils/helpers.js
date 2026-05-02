const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate JWT token for a user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Get OTP expiry date (default 5 minutes from now)
 */
const getOTPExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generateToken, generateOTP, getOTPExpiry };
