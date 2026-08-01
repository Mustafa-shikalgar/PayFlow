const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/webhookController');

// Webhook needs raw body for signature verification
// The controller parses the raw Buffer into JSON
router.post('/razorpay', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
