// controller/paymentController.js
const { createInvoiceService } = require('../services/invoiceService');
const Transaction = require('../models/Transaction');

exports.createInvoice = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User tidak terautentikasi' });
    }

    const BASE_URL = process.env.BASE_URL || 'https://yourdomain.com';

    const invoice = await createInvoiceService({
      ...req.body,
      user_id: userId,
      ipn_callback_url: `${BASE_URL}/api/payment/webhook`,
      success_url: `${BASE_URL}/payment/success`,
      cancel_url: `${BASE_URL}/payment/cancel`
    });

    res.json(invoice);
  } catch (err) {
    console.error('❌ Error createInvoice:', err.message);
    res.status(400).json({ error: err.message });
  }
};

exports.getInvoiceDetail = async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const { userId, role } = req.user;

    const tx = await Transaction.findOne({ invoice_id });

    if (!tx) return res.status(404).json({ message: 'Invoice tidak ditemukan' });

    // 🚫 Batasi akses jika bukan admin
    if (role !== 'admin' && tx.user_id !== userId) {
      return res.status(403).json({ message: 'Tidak punya akses ke invoice ini' });
    }

    res.json(tx);
  } catch (err) {
    console.error('❌ Gagal mengambil detail invoice:', err);
    res.status(500).json({ message: 'Gagal mengambil detail invoice' });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const [total_invoices, finishedTx, pending, failed] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.find({ payment_status: 'finished' }),
      Transaction.countDocuments({ payment_status: 'waiting' }),
      Transaction.countDocuments({ payment_status: 'failed' }),
    ]);

    const total_paid = finishedTx.reduce((acc, tx) => {
      const amount = parseFloat(tx.price_amount);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    res.json({
      total_invoices,
      total_paid: total_paid.toFixed(2),
      pending,
      failed
    });
  } catch (err) {
    console.error('❌ Gagal mengambil statistik admin:', err);
    res.status(500).json({ message: 'Gagal mengambil statistik admin' });
  }
};
