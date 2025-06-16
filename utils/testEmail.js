require('dotenv').config();
const { sendPaymentSuccessEmail } = require('../utils/email');

sendPaymentSuccessEmail({
  to: 'sanzystoreid@gmail.com',
  subject: 'Test Email Manual',
  text: 'Ini adalah test email dari sistem Sanzy.'
});
