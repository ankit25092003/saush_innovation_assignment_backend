const nodemailer = require('nodemailer');

/**
 * Send OTP via email
 * In development mode, OTP is logged to console instead of sending email
 */
const sendOTPEmail = async (email, otp) => {
  // In development, just log the OTP
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n========================================`);
    console.log(`  OTP for ${email}: ${otp}`);
    console.log(`========================================\n`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"TaskManager" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your OTP for TaskManager',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: auto;">
          <h2 style="color: #6C63FF;">TaskManager</h2>
          <p>Your one-time password (OTP) is:</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #333;">
            ${otp}
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 15px;">
            This OTP expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

module.exports = { sendOTPEmail };
