const { validationResult } = require('express-validator');
const { User } = require('../models');
const { generateToken, generateOTP, getOTPExpiry } = require('../utils/helpers');
const { sendOTPEmail } = require('../utils/email');

/**
 * POST /api/auth/signup
 * Register a new user
 */
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user
    const user = await User.create({ name, email, password, phone });

    // Generate OTP for verification
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = getOTPExpiry();
    await user.save();

    // Send OTP
    await sendOTPEmail(email, otp);

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created. OTP sent to your email for verification.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login with email & password
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/send-otp
 * Send OTP to user's email
 */
const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = getOTPExpiry();
    await user.save();

    const sent = await sendOTPEmail(email, otp);
    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return JWT
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
      });
    }

    // Check expiry
    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Mark as verified and clear OTP
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'OTP verified successfully.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { user: req.user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, sendOTP, verifyOTP, getMe };
