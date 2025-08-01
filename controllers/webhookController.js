// controllers/webhookController.js
const axios           = require('axios');
const Transaction     = require('../models/Transaction');
const logger          = require('../utils/logger');
const verifySignature = require('../utils/verifyWebhook');
const sendTelegram    = require('../utils/sendTelegram');

/* ENV helpers */
const BACKEND_URL   = process.env.BASE_URL      || 'http://localhost:3000';
const MGC_API_URL   = process.env.MAIN_API_URL  || 'https://mgc.bot';
const INTERNAL_KEY  = process.env.INTERNAL_MASTER_KEY;

/* ────────────────────────────────────────────────────────── */
exports.handleWebhook = async (req, res) => {
  /* 1. Verify HMAC header (NowPayments) */
  if (!verifySignature(req)) {
    logger.warn('❌ Invalid webhook signature');
    return res.status(401).json({ error: 'Unauthorized signature' });
  }

  /* 2. Parse payload */
  const payload = JSON.parse(req.body.toString());
  const {
    payment_id,
    invoice_id,
    payment_status,
    pay_address,
    pay_currency
  } = payload;

  console.log(payload);
  logger.info({ event: 'webhook_received', payment_id, invoice_id, payment_status }.toString());

  /* 3. Get transaction from DB */
  const transaction = await Transaction.findOne({ payment_id, invoice_id });
  if (!transaction) {
    logger.error('❌ Transaction not found');
    return res.status(404).json({ error: 'Transaction not found' });
  }

  /* 3-bis. ADDITIONAL VALIDATION (Checklist #3) */
  const amountUSD = parseFloat(transaction.price_amount);
  if (isNaN(amountUSD) || amountUSD <= 0) {
    logger.error({ event: 'invalid_amount', payment_id, price_amount: transaction.price_amount });
    return res.status(400).json({ error: 'Invalid amount' });
  }
  if (!transaction.telegram_id) {
    logger.error({ event: 'missing_telegram_id', payment_id });
    return res.status(400).json({ error: 'Missing telegram_id in transaction' });
  }

  /* 4. Prevent re-process */
  if (transaction.payment_status === 'finished') {
    logger.warn('⚠️ Webhook processed previously.');
    return res.json({ success: true, message: 'Already processed' });
  }

  /* 5. Update transaction */
  transaction.payment_status = payment_status;
  transaction.pay_address    = pay_address;
  transaction.pay_currency   = pay_currency;
  transaction.updated_at     = new Date();
  await transaction.save();

  logger.info({
    event: 'transaction_updated',
    invoice_id,
    status: payment_status,
    time: transaction.updated_at
  });

  /* 6. If payment finished → refill & notification */
  if (payment_status === 'finished') {
    const bonusPercent = parseInt(process.env.BONUS_PERCENTAGE || '0', 10);
    const totalUSD     = amountUSD + (amountUSD * bonusPercent / 100);
    const creditsAdd   = Math.round(totalUSD * 1000); // $1 = 1000 credits

    /* 6a. Add credits in MGCBot */
    try {
      const refillRes = await axios.post(
        `${MGC_API_URL}/api/credit/refill`,
        {
          telegramId    : transaction.telegram_id,
          amount        : creditsAdd,
          method        : 'NowPayments',
          extra_percent : transaction.extra_percent || 0
        },
        { headers: { 'x-internal-api-key': INTERNAL_KEY, 'Content-Type': 'application/json' } }
      );

      logger.info({
        event   : 'mgc_refill_success',
        telegram: transaction.telegram_id,
        credits : creditsAdd,
        response: refillRes.data
      });
    } catch (err) {
      logger.error({
        event   : 'mgc_refill_failed',
        telegram: transaction.telegram_id,
        error   : err.response?.data || err.message
      });
    }

    /* 6b. Notify user */
    try {
      await sendTelegram(
        transaction.telegram_id,
        `✅ Top-up *$${amountUSD.toFixed(2)}* (+${bonusPercent}%) successful!\n` +
        `💳 Credits added *${creditsAdd.toLocaleString('en-US')}*`
      );
    } catch {/**/}

    /* 6c. Send latest balance */
    try {
      const balRes = await axios.get(
        `${MGC_API_URL}/api/user/${transaction.telegram_id}/balance`,
        { headers: { 'x-internal-api-key': INTERNAL_KEY } }
      );
      const creditsNow = balRes.data.credits ?? balRes.data.balance ?? 0;

      await sendTelegram(
        transaction.telegram_id,
        `🏦 Your latest balance: *${creditsNow.toLocaleString('en-US')}* credits`,
      );
    } catch {/**/}

    /* 6d. Notify admin */
    if (process.env.TELEGRAM_ADMIN_ID) {
      sendTelegram(
        process.env.TELEGRAM_ADMIN_ID,
        `💸 User ${transaction.telegram_id} top-up $${amountUSD.toFixed(2)} → ` +
        `+${creditsAdd.toLocaleString('en-US')} credits`
      ).catch(()=>{});
    }
  }

  return res.json({ success: true });
};
