// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyPassword,hashPassword } = require('../utils/hash');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Email tidak ditemukan' });

  const valid = await verifyPassword(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Password salah' });

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({ token });
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cek apakah user sudah ada
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email sudah terdaftar' });

    const hashed = await hashPassword(password);

    const newUser = await User.create({ email, password: hashed, role: 'user' });
    
    res.status(201).json({ message: 'User berhasil didaftarkan', userId: newUser._id });
  } catch (err) {
    console.error('❌ Gagal registrasi:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
