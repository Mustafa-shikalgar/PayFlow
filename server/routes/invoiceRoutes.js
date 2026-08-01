const express = require('express');
const router = express.Router();
const { downloadInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.get('/:id', protect, downloadInvoice);

module.exports = router;