const express = require('express');
const router = express.Router();
const keyController = require('../controllers/keyController');

router.post('/generate', keyController.generateKey);

module.exports = router;
