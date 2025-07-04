// routes/payments.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { createInvoiceLimiter } = require('../middleware/rateLimiter');

// Telegram
router.post('/telegram-create', createInvoiceLimiter, paymentController.createInvoiceFromTelegram);
router.get('/balance', paymentController.getBalance);

// Web Dashboard
router.post('/create', createInvoiceLimiter, paymentController.createInvoice);
router.get('/admin/stats', paymentController.getAdminStats);
router.get('/admin/daily', paymentController.getDailyReport);
router.get('/report/summary', paymentController.getSummary);
router.get('/history', paymentController.getTransactionHistory);
router.get('/:invoice_id', paymentController.getInvoiceDetail);

module.exports = router;
