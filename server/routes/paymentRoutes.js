const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  requestRefund,
  getPaymentHistory,
  getRefunds,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const {
  createOrderValidator,
  verifyPaymentValidator,
  refundValidator,
} = require('../validators/paymentValidator');

router.post('/create-order', protect, paymentLimiter, createOrderValidator, validate, createOrder);
router.post('/verify', protect, verifyPaymentValidator, validate, verifyPayment);
router.post('/refund', protect, refundValidator, validate, requestRefund);
router.get('/history', protect, getPaymentHistory);
router.get('/refunds', protect, getRefunds);

module.exports = router;