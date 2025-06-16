// utils/nowpayments.js
const axios = require('axios');

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

const createPayment = async (paymentData) => {
  const response = await axios.post('https://api.nowpayments.io/v1/payment', paymentData, {
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

module.exports = {
  createPayment
};
