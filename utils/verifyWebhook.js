// utils/verifyWebhook.js
const crypto = require('crypto');

module.exports = function verifyWebhookSignature(req) {
  const signature = req.headers['x-nowpayments-sig'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !secret) return false;

  const computedSig = crypto
    .createHmac('sha512', secret)
    .update(req.body) // raw buffer
    .digest('hex');

  return signature === computedSig;
};
