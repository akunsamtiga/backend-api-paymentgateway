// routes/admin.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/authMiddleware');

// Sederhana: List semua transaksi
router.get('/transactions', auth(['admin']), async (req, res) => {
  try {
    const data = await Transaction.find().sort({ created_at: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data transaksi' });
  }
});

module.exports = router;
