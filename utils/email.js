// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendPaymentSuccessEmail = async ({ to, subject, text }) => {
  console.log('📨 Getting ready to send email to:', to);
  try {
    const info = await transporter.sendMail({
      from: `"Sanzy Pay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log('✅ Email sent:', info.response);
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
  }
};
