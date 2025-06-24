// controller/webhookController.js
const axios = require('axios');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const verifyWebhookSignature = require('../utils/verifyWebhook');
const sendTelegram = require('../utils/sendTelegram');
const { sendPaymentSuccessEmail } = require('../utils/email');

exports.handleWebhook = async (req, res) => {
  if (!verifyWebhookSignature(req)) {
    logger.warn('❌ Invalid webhook signature');
    return res.status(401).json({ error: 'Unauthorized signature' });
  }

  try {
    const payload = JSON.parse(req.body.toString());

    const {
      payment_id,
      invoice_id,
      payment_status,
      pay_address,
      pay_currency
    } = payload;

    logger.info({ event: 'webhook_received', payment_id, invoice_id, payment_status });

    const transaction = await Transaction.findOne({ payment_id, invoice_id });

    if (!transaction) {
      logger.error('❌ Transaction not found');
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.payment_status === 'finished') {
      logger.warn('⚠️ Webhook has been processed previously.');
      return res.json({ success: true, message: 'Already processed' });
    }

    transaction.payment_status = payment_status;
    transaction.pay_address = pay_address;
    transaction.pay_currency = pay_currency;
    transaction.updated_at = new Date();
    await transaction.save();

    logger.info({
      event: 'transaction_updated',
      invoice_id,
      status: payment_status,
      time: transaction.updated_at
    });

    if (payment_status === 'finished') {
      const baseAmount = parseFloat(transaction.price_amount);
      const bonusPercentage = 10;
      const totalUSD = baseAmount + (baseAmount * bonusPercentage / 100);

      const refillPayload = {
        id: transaction.xsid,
        amount: Math.round(totalUSD * 1000), // $1 = 1000 poin
        extra: bonusPercentage,
        operator: 'nowpayments',
        is_operator_funds: true
      };

      try {
        const refillRes = await axios.post(`${process.env.XSID_API_URL}/refillXSID`, refillPayload);
        logger.info({
          event: 'xsid_refill_success',
          xsid: transaction.xsid,
          amount: refillPayload.amount,
          response: refillRes.data
        });
      } catch (err) {
        logger.error({
          event: 'xsid_refill_failed',
          xsid: transaction.xsid,
          error: err.response?.data || err.message
        });
      }

      try {
        const message = `✅ Top up XSID ${transaction.xsid} of $${baseAmount} successful! (+${bonusPercentage}% bonus)`;
        if (transaction.telegram_id) {
          await sendTelegram(transaction.telegram_id, message);
        }

        if (process.env.TELEGRAM_ADMIN_ID) {
          await sendTelegram(
            process.env.TELEGRAM_ADMIN_ID,
            `💸 User ${transaction.xsid} has topped up $${baseAmount} via NowPayments.`
          );
        }
      } catch (err) {
        logger.warn({
          event: 'telegram_notification_failed',
          error: err.message
        });
      }

      if (transaction.customer_email) {
        try {
          await sendPaymentSuccessEmail({
            to: transaction.customer_email,
            subject: 'Payment Successful',
            text: `Halo,\n\nYour payment with order ID ${transaction.order_id} of ${transaction.price_amount} ${transaction.price_currency} has been successful.\n\nThank you for using our services.`
          });

          logger.info({
            event: 'email_sent',
            email: transaction.customer_email,
            order_id: transaction.order_id,
            time: new Date()
          });
        } catch (err) {
          logger.warn({
            event: 'email_failed',
            error: err.message,
            email: transaction.customer_email
          });
        }
      }
    }

    return res.json({ success: true });
  } catch (err) {
    logger.error('❌ Webhook handler error', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
