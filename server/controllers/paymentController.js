const crypto = require('crypto');
const getRazorpay = require('../config/razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generateInvoicePDF } = require('../services/invoiceService');
const { sendPaymentReceiptEmail, sendRefundStatusEmail } = require('../services/emailService');
const Log = require('../models/Log');

/**
 * Generate a unique order ID.
 */
const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

/**
 * Generate a unique payment ID.
 */
const generatePaymentId = () => {
  return `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

/**
 * Generate a unique refund ID.
 */
const generateRefundId = () => {
  return `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

/**
 * @desc    Create a Razorpay order
 * @route   POST /api/payments/create-order
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', description } = req.body;

  // Create Razorpay order
  const razorpay = getRazorpay();
  const razorpayOrder = await razorpay.orders.create({
    amount,
    currency,
    receipt: `receipt_${Date.now()}`,
    notes: {
      userId: req.user._id.toString(),
      description: description || 'Payment',
    },
  });

  // Create order in DB
  const order = await Order.create({
    orderId: generateOrderId(),
    amount,
    currency,
    user: req.user._id,
    razorpayOrderId: razorpayOrder.id,
    description: description || 'Payment',
    status: 'created',
  });

  res.status(201).json({
    success: true,
    data: {
      order,
      razorpayOrder,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

/**
 * @desc    Verify payment signature (backend verification)
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Find the order
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Ensure order belongs to the authenticated user
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to verify this payment', 403);
  }

  // Duplicate payment prevention: check if payment already exists
  const existingPayment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });
  if (existingPayment) {
    return res.json({
      success: true,
      message: 'Payment already verified',
      data: { payment: existingPayment, alreadyProcessed: true },
    });
  }

  // Verify signature using HMAC SHA256
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    // Log failed verification
    await Log.create({
      type: 'payment',
      action: 'signature_verification_failed',
      user: req.user._id,
      metadata: { razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id },
      ip: req.ip,
      status: 'error',
    });
    throw new AppError('Payment signature verification failed', 400);
  }

  // Fetch payment details from Razorpay to confirm capture
  let razorpayPayment;
  try {
    const rzp = getRazorpay();
    razorpayPayment = await rzp.payments.fetch(razorpay_payment_id);
  } catch (err) {
    throw new AppError('Failed to fetch payment details from Razorpay', 500);
  }

  if (razorpayPayment.status !== 'captured') {
    throw new AppError(`Payment not captured. Status: ${razorpayPayment.status}`, 400);
  }

  // Create payment record
  const payment = await Payment.create({
    paymentId: generatePaymentId(),
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    signature: razorpay_signature,
    order: order._id,
    user: req.user._id,
    amount: razorpayPayment.amount,
    currency: razorpayPayment.currency || 'INR',
    status: 'captured',
    method: razorpayPayment.method || 'other',
    description: order.description,
    idempotencyKey: razorpay_payment_id,
  });

  // Update order status
  order.status = 'paid';
  order.razorpayPaymentId = razorpay_payment_id;
  await order.save();

  // Generate invoice PDF
  let invoice = null;
  try {
    const populatedPayment = await Payment.findById(payment._id)
      .populate('user', 'name email phone')
      .populate('order');
    const result = await generateInvoicePDF(populatedPayment);
    invoice = result.invoice;
  } catch (err) {
    console.error('Invoice generation failed:', err.message);
  }

  // Send email receipt (non-blocking)
  try {
    const user = await User.findById(req.user._id);
    await sendPaymentReceiptEmail(user, payment, invoice);
  } catch (err) {
    console.error('Receipt email failed:', err.message);
  }

  // Log successful payment
  await Log.create({
    type: 'payment',
    action: 'payment_verified',
    user: req.user._id,
    metadata: { paymentId: payment.paymentId, amount: payment.amount },
    ip: req.ip,
    status: 'success',
  });

  res.status(201).json({
    success: true,
    message: 'Payment verified successfully',
    data: { payment, invoice },
  });
});

/**
 * @desc    Request a refund
 * @route   POST /api/payments/refund
 * @access  Private
 */
const requestRefund = asyncHandler(async (req, res) => {
  const { paymentId, reason, amount } = req.body;

  // Find payment
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Ensure payment belongs to user
  if (payment.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to refund this payment', 403);
  }

  // Check payment status
  if (payment.status === 'refunded') {
    throw new AppError('Payment has already been refunded', 400);
  }

  // Check for existing pending refund
  const existingRefund = await Refund.findOne({ payment: payment._id, status: 'pending' });
  if (existingRefund) {
    throw new AppError('A refund request is already pending for this payment', 400);
  }

  // Determine refund amount (default to full amount)
  const refundAmount = amount || payment.amount;
  if (refundAmount > payment.amount - payment.refundedAmount) {
    throw new AppError('Refund amount exceeds the refundable amount', 400);
  }

  // Create refund request
  const refund = await Refund.create({
    refundId: generateRefundId(),
    payment: payment._id,
    user: req.user._id,
    reason,
    amount: refundAmount,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Refund request submitted. It will be reviewed by an admin.',
    data: { refund },
  });
});

/**
 * @desc    Get payment history
 * @route   GET /api/payments/history
 * @access  Private
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const status = req.query.status || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  // Build query
  const query = { user: req.user._id };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { paymentId: { $regex: search, $options: 'i' } },
      { razorpayOrderId: { $regex: search, $options: 'i' } },
      { razorpayPaymentId: { $regex: search, $options: 'i' } },
    ];
  }

  // Execute query
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('order', 'orderId description')
      .populate('invoice', 'invoiceNumber'),
    Payment.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Get refund requests for the current user
 * @route   GET /api/payments/refunds
 * @access  Private
 */
const getRefunds = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { user: req.user._id };

  const [refunds, total] = await Promise.all([
    Refund.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('payment', 'paymentId amount currency'),
    Refund.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      refunds,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

module.exports = {
  createOrder,
  verifyPayment,
  requestRefund,
  getPaymentHistory,
  getRefunds,
};
