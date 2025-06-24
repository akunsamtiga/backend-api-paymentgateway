// models/BotUser.js
const mongoose = require('mongoose');

const botUserSchema = new mongoose.Schema({
  telegram_id: { type: String, required: true, unique: true },
  xsid: { type: String, required: true }
});

module.exports = mongoose.model('BotUser', botUserSchema);
