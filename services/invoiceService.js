// services/invoiceService.js
const axios = require('axios');
const Transaction = require('../models/Transaction');
const { createInvoiceSchema } = require('../validators/paymentValidator');

async function createInvoiceService(data) {
  // ✅ Validasi
  const { error } = createInvoiceSchema.validate(data);
  if (error) throw new Error(error.details[0].message);

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

  // 🔗 Panggil API NowPayments
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

  // 💾 Simpan transaksi ke database
  await Transaction.create({
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

  return invoice;
}

module.exports = { createInvoiceService };
