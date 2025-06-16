// routes/payments.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/authMiddleware');

// 🧾 Endpoint untuk membuat invoice (dengan otentikasi)
router.post('/create', auth(), paymentController.createInvoice);

// 📜 Endpoint riwayat transaksi
router.get('/history', auth(), async (req, res) => {
  try {
    const { email, status, order_id, page = 1, limit = 10 } = req.query;
    const { userId, role } = req.user;

    const query = {};

    if (role !== 'admin') {
      query.user_id = userId;
    }

    if (email) query.customer_email = email;
    if (status) query.payment_status = status;
    if (order_id) query.order_id = order_id;
    if (req.query.start_date && req.query.end_date) {
      query.created_at = {
        $gte: new Date(req.query.start_date),
        $lte: new Date(req.query.end_date + 'T23:59:59.999Z')
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      transactions,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('❌ Gagal mengambil riwayat transaksi:', err);
    res.status(500).json({ error: 'Gagal mengambil riwayat transaksi' });
  }
});

// ✨ Endpoint: Statistik Admin
router.get('/admin/stats', auth(['admin']), paymentController.getAdminStats);
// ✨ Endpoint: Detail Invoice
router.get('/:invoice_id', auth(), paymentController.getInvoiceDetail);


module.exports = router;
