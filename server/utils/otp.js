const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Get OTP expiry time (default 10 minutes)
const getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

// Send OTP via email
const sendOTPEmail = async (email, otp, name) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const mailOptions = {
    from: `"Sishu Arogaya" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Sishu Arogaya OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a6b3c;">Sishu Arogaya</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your one-time password (OTP) for login is:</p>
        <h1 style="color: #1a6b3c; letter-spacing: 8px;">${otp}</h1>
        <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #999; font-size: 12px;">Government Integrated Child Health Monitoring System</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, getOTPExpiry, sendOTPEmail };
