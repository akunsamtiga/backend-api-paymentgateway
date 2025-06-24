// webhooksimulation/signature.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

// === Configuration ===
const PAYLOAD_PATH = path.join(__dirname, '/payload.json');
const WEBHOOK_URL = 'http://localhost:3000/api/payment/webhook';
const WEBHOOK_SECRET = 'o4PvCkzw6fa3sT9VNw58ibcxYMGtwSVI';

async function simulateWebhook() {
  try {
    const rawBody = fs.readFileSync(PAYLOAD_PATH);
    
    const signature = crypto
      .createHmac('sha512', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    console.log('✅ Signature successfully generated:\n', signature);

    const response = await axios.post(WEBHOOK_URL, rawBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-nowpayments-sig': signature
      }
    });

    console.log('\n✅ Webhook sent successfully:');
    console.log(response.data);
  } catch (err) {
    console.error('\n❌ Failed to send webhook:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

simulateWebhook();
