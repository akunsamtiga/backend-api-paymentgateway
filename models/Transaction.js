// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: { type: String, required: true }, // ✅ Tambahan
  payment_id: String,
  invoice_id: String,
  order_id: String,
  order_description: String,
  price_amount: Number,
  price_currency: String,
  pay_address: String,
  pay_currency: String,
  payment_status: String,
  invoice_url: String,
  customer_email: String,
  created_at: Date,
  updated_at: Date,
});

module.exports = mongoose.model('Transaction', transactionSchema);
