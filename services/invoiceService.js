// services/invoiceService.js
const axios = require('axios');
const Transaction = require('../models/Transaction');
const { createInvoiceSchema } = require('../validators/paymentValidator');
const logger = require('../utils/logger');

/**
 * 
 * @param {Object} data 
 * @returns {Promise<Object>} 
 */
async function createInvoiceService(data) {
  const { error } = createInvoiceSchema.validate(data);
  if (error) {
    logger.warn({ event: 'invoice_validation_failed', details: error.details[0] });
    throw new Error(error.details[0].message);
  }

  const {
    price_amount,
    price_currency,
    order_id,
    order_description,
    ipn_callback_url,
    success_url,
    cancel_url,
    customer_email,
    user_id
  } = data;

  try {
    const response = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      {
        price_amount,
        price_currency,
        order_id,
        order_description,
        ipn_callback_url,
        success_url,
        cancel_url,
        customer_email
      },
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const invoice = response.data;

    const transaction = await Transaction.create({
      user_id,
      invoice_id: invoice.id,
      payment_id: invoice.token_id,
      order_id: invoice.order_id,
      order_description: invoice.order_description,
      price_amount: invoice.price_amount,
      price_currency: invoice.price_currency,
      invoice_url: invoice.invoice_url,
      customer_email: invoice.customer_email || customer_email,
      payment_status: 'waiting',
      created_at: new Date(),
      updated_at: new Date()
    });

    logger.info({
      event: 'invoice_created',
      invoice_id: invoice.id,
      order_id: invoice.order_id,
      user_id,
      time: transaction.created_at
    });

    return invoice;
  } catch (err) {
    logger.error({
      event: 'invoice_creation_failed',
      message: err.message,
      response: err.response?.data || null
    });

    throw new Error(
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Failed to create invoice in NowPayments'
    );
  }
}

module.exports = { createInvoiceService };
