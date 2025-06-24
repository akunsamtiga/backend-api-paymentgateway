// utils/sendTelegram.js
const axios = require('axios');

/**
 * @param {string} chatId
 * @param {string} text 
 * @returns {Promise<void>}
 */
const sendTelegram = async (chatId, text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return console.error('❌ TELEGRAM_BOT_TOKEN not found in environment');
  }

  if (!chatId || !text) {
    return console.warn('⚠️ chatId and text must be filled in to send a Telegram message');
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = { chat_id: chatId, text };

    const res = await axios.post(url, payload);
    console.log(`📨 Telegram sent to ${chatId}`);
    return res.data;
  } catch (err) {
    console.error('❌ Failed to send Telegram message:', err.response?.data || err.message);
  }
};

module.exports = sendTelegram;
