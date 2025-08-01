// controllers/paymentController.js
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Transaction = require('../models/Transaction');
const BotUser = require('../models/BotUser');
const { createInvoiceService } = require('../services/invoiceService');
const logger = require('../utils/logger');

exports.createInvoice = async (req, res) => {
  try {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    const user_id  = req.body.user_id || 'anonymous';

    const invoice = await createInvoiceService({
      ...req.body,
      user_id,
      ipn_callback_url : `${BASE_URL}/api/payment/webhook`,
      success_url      : `${BASE_URL}/payment/success`,
      cancel_url       : `${BASE_URL}/payment/cancel`
    });

    logger.info({ event: 'create_invoice', user_id, invoice_id: invoice.id });
    return res.json(invoice);
  } catch (err) {
    logger.error('create_invoice_error', err.message);
    return res.status(400).json({ error: err.message });
  }
};


exports.createInvoiceFromTelegram = async (req, res) => {
  try {
    const { telegram_id, nominal, extra_percent } = req.body;
    if (!telegram_id || !nominal) {
      return res.status(400).json({ error: 'telegram_id and nominal are required' });
    }

    const user = await BotUser.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ error: 'User has not bound XSID' });
    }

    /* ---------- Create invoice in NowPayments ---------- */
    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    const orderId  = `MGC-${uuidv4().slice(0, 8)}`;

    let emailSafe = user.email;
    // if (!emailSafe || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSafe)) {
    //   emailSafe = `${user.xsid.replace(/[^a-zA-Z0-9]/g, '')}@gmail.com`.slice(0, 50);
    // }

    const payload = {
      price_amount      : nominal + 0.7, // Add $0.7 fee to invoice amount
      price_currency    : 'USD',
      order_id          : orderId,
      order_description : `Telegram Top up`,
      ipn_callback_url  : `${BASE_URL}/api/payment/webhook`,
      customer_email    : emailSafe
    };

    const invoiceResponse = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      payload,
      {
        headers: {
          'x-api-key'   : process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const invoice = invoiceResponse.data;

    await Transaction.create({
      user_id           : 'telegram',
      telegram_id,
      payment_id        : invoice.token_id,
      invoice_id        : invoice.id,
      order_id          : invoice.order_id,
      order_description : invoice.order_description,
      price_amount      : nominal, // Store original amount for refill calculation
      price_currency    : invoice.price_currency,
      invoice_url       : invoice.invoice_url,
      customer_email    : emailSafe,
      payment_status    : 'waiting',
      extra_percent     : extra_percent || 0,
      created_at        : new Date(),
      updated_at        : new Date()
    });

    logger.info({
      event       : 'telegram_invoice_created',
      telegram_id,
      invoice_id  : invoice.id,
      nominal
    });

    return res.json(invoice);
  } catch (err) {
    const detail = err.response?.data || err.message;
    logger.error('telegram_create_invoice_error', detail);
    return res.status(500).json({ error: detail });
  }
};


exports.getInvoiceDetail = async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const tx = await Transaction.findOne({ invoice_id });

    if (!tx) return res.status(404).json({ message: 'Invoice not found' });

    return res.json(tx);
  } catch (err) {
    logger.error('get_invoice_detail_error', err.message);
    return res.status(500).json({ message: 'Failed to fetch invoice details' });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const { email, status, order_id, page = 1, limit = 10 } = req.query;

    const query = {};
    if (email) query.customer_email = email;
    if (status) query.payment_status = status;
    if (order_id) query.order_id = order_id;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    logger.info({ event: 'get_transaction_history', total });
    return res.json({ transactions, total, page: +page, limit: +limit });
  } catch (err) {
    logger.error('get_transaction_history_error', err.message);
    return res.status(500).json({ error: 'Failed to retrieve transaction history' });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const [total_invoices, finishedTx, pending, failed] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.find({ payment_status: 'finished' }),
      Transaction.countDocuments({ payment_status: 'waiting' }),
      Transaction.countDocuments({ payment_status: 'failed' })
    ]);

    const total_paid = finishedTx.reduce((acc, tx) => {
      const amount = parseFloat(tx.price_amount);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    return res.json({
      total_invoices,
      total_paid: total_paid.toFixed(2),
      pending,
      failed
    });
  } catch (err) {
    logger.error('get_admin_stats_error', err.message);
    return res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
};

// GET /payment/admin/daily
exports.getDailyReport = async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6);

    const result = await Transaction.aggregate([
      {
        $match: {
          created_at: { $gte: new Date(last7Days) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          count: { $sum: 1 },
          total: {
            $sum: {
              $cond: [
                { $eq: ['$payment_status', 'finished'] },
                { $toDouble: '$price_amount' },
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const data = result.map(d => ({
      date: d._id,
      count: d.count,
      total: d.total
    }));

    res.json(data);
  } catch (err) {
    console.error('❌ Failed to fetch daily report:', err);
    res.status(500).json({ message: 'Failed to fetch daily report' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { email, start_date, end_date } = req.query;
    const query = {};

    if (email) query.customer_email = email;
    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) query.created_at.$gte = new Date(start_date);
      if (end_date) {
        const end = new Date(end_date);
        end.setDate(end.getDate() + 1); 
        query.created_at.$lt = end;
      }
    }

    const transactions = await Transaction.find(query);
    const total_paid = transactions.reduce((acc, tx) => {
      return acc + (tx.payment_status === 'finished' ? parseFloat(tx.price_amount) : 0);
    }, 0);

    res.json({
      total: transactions.length,
      total_paid: total_paid.toFixed(2),
      email: email || 'All',
      date_range: { start_date, end_date }
    });
  } catch (err) {
    console.error('❌ Failed to retrieve summary:', err);
    res.status(500).json({ error: 'Failed to retrieve summary' });
  }
};

exports.getBalance = async (req, res) => {
  const { telegram_id } = req.query;
  if (!telegram_id) return res.status(400).json({ error: 'telegram_id is required' });

  try {
    const mgc = await axios.get(
      `${process.env.MAIN_API_URL || 'https://mgc.bot'}/api/user/${telegram_id}/balance`,
      { headers: { 'x-internal-api-key': process.env.INTERNAL_MASTER_KEY } }
    );

    const credits = mgc.data.credits ?? mgc.data.balance ?? 0;
    return res.json({ telegram_id, credits: Number(credits) });
  } catch (err) {
    console.error('❌ Failed to fetch balance from MGC:', err.response?.data || err.message);
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'User not found on MGCBot' });
    }
    return res.status(500).json({ error: 'Failed to get balance from MGC' });
  }
};

