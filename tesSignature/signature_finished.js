// tesSignature/signature_finished.js
const crypto = require('crypto');
const fs = require('fs');

// Isi dari payload.json (dibaca sebagai raw string)
const body = fs.readFileSync('./tesSignature/payload_finished.json');

// Secret kamu dari .env
const secret = 'o4PvCkzw6fa3sT9VNw58ibcxYMGtwSVI';

const signature = crypto
  .createHmac('sha512', secret)
  .update(body)
  .digest('hex');

console.log('✅ Generated Signature:\n', signature);
