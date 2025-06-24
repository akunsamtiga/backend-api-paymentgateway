require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const BotUser = require('../models/BotUser');
const logger = require('../utils/logger');

console.log('🤖 Telegram Bot is active...');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id.toString();
  const name = msg.from.first_name || 'User';

  try {
    const existing = await BotUser.findOne({ telegram_id: chatId });

    const keyboardIfBound = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💰 Top Up 10 USD', callback_data: 'topup_10' }]
        ]
      },
      parse_mode: 'Markdown'
    };

    const keyboardIfNotBound = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 Bind Akun', callback_data: 'bind' }]
        ]
      },
      parse_mode: 'Markdown'
    };

    if (existing) {
      const msgText = `✅ Hai ${name}, your account is already connected to XSID: *${existing.xsid}*.\n\nUse the button below to continue.`;
      logger.info(`[BOT] /start by ${chatId} (already connected: ${existing.xsid})`);
      return bot.sendMessage(chatId, msgText, keyboardIfBound);
    }

    logger.info(`[BOT] /start by ${chatId} (not connected yet)`);
    bot.sendMessage(chatId, `👋 Welcome to *SanzyBot*!\n\nUse the button below or submit:\n👉 /bind YOURXSID`, keyboardIfNotBound);
  } catch (err) {
    logger.error(`[BOT] /start error by ${chatId}: ${err.message}`);
    bot.sendMessage(chatId, '❌ An internal error has occurred. Please try again later.');
  }
});

bot.onText(/^\/bind (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const xsid = match[1];

  if (!/^[a-z0-9\-]{8,30}$/i.test(xsid)) {
    return bot.sendMessage(chatId, '⚠️ Invalid XSID format. Correct example: `xsid-nama-abc123`', { parse_mode: 'Markdown' });
  }

  try {
    const res = await axios.post(`${process.env.XSID_API_URL}/getUser`, { id: xsid });

    if (!res.data?.status || !res.data?.data) {
      logger.warn(`[BOT] /bind failed - XSID not found (${xsid}) oleh ${chatId}`);
      return bot.sendMessage(chatId, '❌ XSID is invalid or not found.');
    }

    await BotUser.findOneAndUpdate({ telegram_id: chatId }, { xsid }, { upsert: true });
    logger.info(`[BOT] /bind successful - ${chatId} connected to ${xsid}`);
    bot.sendMessage(chatId, `✅ XSID *${xsid}* connected successfully!\nUse /topup <nominal> to top up your balance.`, { parse_mode: 'Markdown' });
  } catch (err) {
    logger.error(`[BOT] /bind error by ${chatId}: ${err.message}`);
    bot.sendMessage(chatId, '❌ An error occurred while connecting XSID.');
  }
});

bot.onText(/^\/topup (\d+)$/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const amount = parseInt(match[1]);

  if (isNaN(amount) || amount < 1 || amount > 100) {
    return bot.sendMessage(chatId, '⚠️ The nominal must be between *1* and *100* USD.\nExample: /topup 10', { parse_mode: 'Markdown' });
  }

  try {
    const user = await BotUser.findOne({ telegram_id: chatId });

    if (!user) {
      return bot.sendMessage(chatId, '❌ You are not connected to an XSID. Use /bind YOURXSID');
    }

    const response = await axios.post(`${process.env.BASE_URL}/api/payment/telegram-create`, {
      telegram_id: chatId,
      nominal: amount
    });

    const invoiceUrl = response.data?.invoice_url;

    if (invoiceUrl) {
      logger.info(`[BOT] /topup ${amount} USD by ${chatId} (${user.xsid})`);
      bot.sendMessage(chatId, `🔗 *Invoice successfully created!*\nPlease pay at the following link:\n${invoiceUrl}`, { parse_mode: 'Markdown' });
    } else {
      logger.warn(`[BOT] /topup failed to create invoice - ${chatId}`);
      bot.sendMessage(chatId, '❌ Failed to create invoice. Please try again later.');
    }
  } catch (err) {
    logger.error(`[BOT] /topup error by ${chatId}: ${err.message}`);
    bot.sendMessage(chatId, '❌ An error occurred while creating the invoice.');
  }
});

// 🚫 Disabled unbind feature (kept for future use)
bot.onText(/^\/unbind$/, async (msg) => {
  const chatId = msg.chat.id.toString();

  // try {
  //   const existing = await BotUser.findOne({ telegram_id: chatId });

  //   if (!existing) {
  //     return bot.sendMessage(chatId, '⚠️ You are not connected to any XSID.');
  //   }

  //   await BotUser.deleteOne({ telegram_id: chatId });
  //   logger.info(`[BOT] /unbind - ${chatId} has unlinked XSID ${existing.xsid}`);
  //   bot.sendMessage(chatId, '✅ Connection to XSID has been removed.\nUse /bind YOURXSID to reconnect.');
  // } catch (err) {
  //   logger.error(`[BOT] /unbind error by ${chatId}: ${err.message}`);
  //   bot.sendMessage(chatId, '❌ An error occurred during unbinding. Please try again later.');
  // }

  // Placeholder response:
  bot.sendMessage(chatId, '🚫 The /unbind feature is currently disabled.');
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  switch (data) {
    case 'bind':
      bot.sendMessage(chatId, '🔗 Please send command:\n/bind YOURXSID');
      break;

    case 'topup_10':
      bot.sendMessage(chatId, '💰 Please send command:\n/topup 10');
      break;

    default:
      bot.sendMessage(chatId, '❓ Command not recognized.');
  }

  bot.answerCallbackQuery(query.id);
});

module.exports = bot;
