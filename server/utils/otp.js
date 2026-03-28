const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const axios = require('axios');

// Generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Get OTP expiry time (default 10 minutes)
const getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

// Send OTP via email using SendGrid
const sendOTPEmail = async (email, otp, name) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Sishu Arogaya',
    },
    subject: 'Your Sishu Arogaya OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #0891b2; margin-bottom: 8px;">🌿 Sishu Arogaya</h2>
        <p style="color: #374151;">Hello <strong>${name}</strong>,</p>
        <p style="color: #374151;">Your one-time password (OTP) for login is:</p>
        <div style="background: #f0fdff; border: 2px solid #0891b2; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
          <h1 style="color: #0891b2; letter-spacing: 12px; font-size: 36px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #374151;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">Government Integrated Child Health Monitoring System · DBUU Dehradun</p>
      </div>
    `,
  };

  await sgMail.send(msg);
};

// Send OTP via SMS using Textbelt
const sendOTPSMS = async (phone, otp) => {
  // Normalize phone: ensure it starts with country code (91 for India)
  const normalized = phone.replace(/\D/g, '');
  const phoneWithCode = normalized.startsWith('91') ? normalized : `91${normalized}`;

  const response = await axios.post('https://textbelt.com/text', {
    phone: phoneWithCode,
    message: `Your Sishu Arogaya OTP is: ${otp}. Valid for 10 minutes. Do not share.`,
    key: process.env.TEXTBELT_API_KEY,
  });

  if (!response.data.success) {
    throw new Error(`SMS failed: ${response.data.error || 'Unknown error'}`);
  }

  return response.data;
};

module.exports = { generateOTP, getOTPExpiry, sendOTPEmail, sendOTPSMS };
