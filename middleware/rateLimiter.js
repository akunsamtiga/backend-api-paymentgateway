// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '⚠️ Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const createInvoiceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: '⚠️ Too many requests for invoice creation. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  createInvoiceLimiter
};
