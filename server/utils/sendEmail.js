const sgMail = require('@sendgrid/mail');

const sendEmail = async (to, otp) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey || !apiKey.startsWith('SG.')) {
    throw new Error('SendGrid API key is not configured');
  }

  sgMail.setApiKey(apiKey);

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'sishuarogaya.gov.in@gmail.com',
    subject: 'OTP Verification',
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
  };

  await sgMail.send(msg);
};

module.exports = { sendEmail };
