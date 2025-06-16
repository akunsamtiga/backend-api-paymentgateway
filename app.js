// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const rawBodyParser = require('body-parser').raw;

const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Gunakan raw-body hanya untuk webhook
app.use('/api/payment/webhook', rawBodyParser({ type: '*/*' }));
app.use(express.json());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '⚠️ Terlalu banyak permintaan, coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api/payment', paymentRoutes);
app.use('/api', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// DB Connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
