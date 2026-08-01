const { body } = require('express-validator');

const createOrderValidator = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isInt({ min: 1 }).withMessage('Amount must be a positive integer (in paise)'),
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP']).withMessage('Currency must be INR, USD, EUR, or GBP'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
];

const verifyPaymentValidator = [
  body('razorpay_order_id')
    .notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty().withMessage('Razorpay signature is required'),
];

const refundValidator = [
  body('paymentId')
    .notEmpty().withMessage('Payment ID is required'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Refund reason is required')
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  body('amount')
    .optional()
    .isInt({ min: 1 }).withMessage('Refund amount must be a positive integer (in paise)'),
];

module.exports = {
  createOrderValidator,
  verifyPaymentValidator,
  refundValidator,
};