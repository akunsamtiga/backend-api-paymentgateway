// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rawBodyParser = require('body-parser').raw;

const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhook');
const keyRoutes = require('./routes/key');

const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(generalLimiter); 

app.use('/api/payment/webhook', rawBodyParser({ type: '*/*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Backend SanzyPay is running.');
});

app.use('/api/payment', paymentRoutes);
app.use('/api', webhookRoutes);
app.use('/api/key', keyRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });
