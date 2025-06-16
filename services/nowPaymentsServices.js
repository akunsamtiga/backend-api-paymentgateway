// services/nowPaymentsServices.js
const axios = require('axios');
const { baseUrl, apiKey } = require('../config/nowpayments');

const createPayment = async (body) => {
  const response = await axios.post(
    `${baseUrl}/invoice`,
    body,
    {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

module.exports = { createPayment };
