// controllers/webhookController.js
const Transaction = require('../models/Transaction');
const { sendPaymentSuccessEmail } = require('../utils/email'); // ✅ fix import
const logger = require('../utils/logger');
const verifyWebhookSignature = require('../utils/verifyWebhook'); // ✅ import verify

const handleWebhook = async (req, res) => {
  // ✅ Verifikasi Signature
  if (!verifyWebhookSignature(req)) {
    console.warn('❌ Invalid signature - rejected webhook');
    return res.status(401).json({ error: 'Unauthorized signature' });
  }

  try {
    const payload = JSON.parse(req.body.toString()); // raw buffer ke string

    const {
      payment_id,
      invoice_id,
      payment_status,
      pay_address,
      pay_currency
    } = payload;

    console.log('📩 Webhook payload diterima:', payload);

    const transaction = await Transaction.findOne({ payment_id, invoice_id });

    if (!transaction) {
      console.error('❌ Transaksi tidak ditemukan.');
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    transaction.payment_status = payment_status;
    transaction.pay_address = pay_address;
    transaction.pay_currency = pay_currency;
    transaction.updated_at = new Date();
    await transaction.save();

    console.log(`📦 Status pembayaran: ${payment_status}`);

    if (payment_status === 'finished') {
      if (transaction.customer_email) {
        console.log(`✅ Mengirim email ke: ${transaction.customer_email}`);
        await sendPaymentSuccessEmail({
          to: transaction.customer_email,
          subject: 'Pembayaran Berhasil',
          text: `Halo,\n\nPembayaran Anda dengan order ID ${transaction.order_id} sebesar ${transaction.price_amount} ${transaction.price_currency} telah berhasil.\n\nTerima kasih telah menggunakan layanan kami.`
        });

        logger.info({
          event: 'payment_finished',
          order_id: transaction.order_id,
          payment_id: transaction.payment_id,
          email: transaction.customer_email,
          time: new Date()
        });
      } else {
        console.warn('⚠️ Email customer tidak tersedia.');
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { handleWebhook };
