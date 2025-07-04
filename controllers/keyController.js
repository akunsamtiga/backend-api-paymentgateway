// controllers/keyController.js
const { v4: uuidv4 } = require('uuid');
const BotUser = require('../models/BotUser');

exports.generateKey = async (req, res) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) return res.status(400).json({ error: 'telegram_id dibutuhkan' });

    const user = await BotUser.findOne({ telegram_id });
    if (!user) return res.status(404).json({ error: 'User belum bind XSID' });

    const newKey = uuidv4();

    // Simpan key ke database jika diperlukan
    user.key = newKey;
    await user.save();

    return res.json({ key: newKey });
  } catch (err) {
    console.error('generateKey error:', err.message);
    return res.status(500).json({ error: 'Gagal generate key' });
  }
};
