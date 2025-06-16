// validators/paymentValidator.js
const Joi = require('joi');

const createInvoiceSchema = Joi.object({
  price_amount: Joi.number().positive().required(),
  price_currency: Joi.string().uppercase().length(3).required(),
  order_id: Joi.string().max(100).required(),
  order_description: Joi.string().max(255).required(),
  ipn_callback_url: Joi.string().uri().optional(),   
  success_url: Joi.string().uri().optional(),        
  cancel_url: Joi.string().uri().optional(),         
  customer_email: Joi.string().email().required(),
  user_id: Joi.string().required()
});

module.exports = { createInvoiceSchema };
