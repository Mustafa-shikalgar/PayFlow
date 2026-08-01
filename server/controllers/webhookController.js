const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Log = require('../models/Log');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify Razorpay webhook signature.
 */
const verifyWebhookSignature = (body, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

/**
 * @desc    Handle Razorpay webhooks
 * @route   POST /api/webhooks/razorpay
 * @access  Public (signature verified)
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  // With express.raw(), req.body is a Buffer. Convert to string for signature verification.
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);

  if (!signature) {
    throw new AppError('Missing webhook signature', 400);
  }

  // Verify signature
  const isValid = verifyWebhookSignature(
    rawBody,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET
  );

  if (!isValid) {
    await Log.create({
      type: 'webhook',
      action: 'invalid_signature',
      metadata: { event: req.body.event },
      ip: req.ip,
      status: 'error',
    });
    throw new AppError('Invalid webhook signature', 400);
  }

  // Parse the raw body into JSON
  const body = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
  const { event, payload } = body;

  // Log webhook event
  await Log.create({
    type: 'webhook',
    action: event,
    metadata: { entity: payload && payload.payment ? payload.payment.entity.id : null },
    ip: req.ip,
    status: 'success',
  });

  // Handle payment events
  switch (event) {
    case 'payment.captured': {
      const paymentEntity = payload.payment.entity;
      const order = await Order.findOne({ razorpayOrderId: paymentEntity.order_id });

      if (order) {
        // Check for duplicate
        const existing = await Payment.findOne({ razorpayPaymentId: paymentEntity.id });
        if (!existing) {
          await Payment.create({
            paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            razorpayOrderId: paymentEntity.order_id,
            razorpayPaymentId: paymentEntity.id,
            signature: 'webhook',
            order: order._id,
            user: order.user,
            amount: paymentEntity.amount,
            currency: paymentEntity.currency || 'INR',
            status: 'captured',
            method: paymentEntity.method || 'other',
            description: order.description,
            idempotencyKey: paymentEntity.id,
          });
          order.status = 'paid';
          order.razorpayPaymentId = paymentEntity.id;
          await order.save();
        }
      }
      break;
    }

    case 'payment.failed': {
      const paymentEntity = payload.payment.entity;
      const order = await Order.findOne({ razorpayOrderId: paymentEntity.order_id });
      if (order && order.status === 'created') {
        order.status = 'failed';
        await order.save();
      }
      break;
    }

    case 'refund.processed': {
      const refundEntity = payload.refund.entity;
      const payment = await Payment.findOne({ razorpayPaymentId: refundEntity.payment_id });
      if (payment) {
        payment.status = 'refunded';
        payment.refundedAmount = refundEntity.amount;
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order) {
          order.status = 'refunded';
          await order.save();
        }
      }
      break;
    }

    default:
      // Unhandled event - just acknowledge
      break;
  }

  res.json({ success: true, received: true });
});

module.exports = { handleWebhook };