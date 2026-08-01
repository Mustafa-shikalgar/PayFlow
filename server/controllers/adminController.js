const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Invoice = require('../models/Invoice');
const Log = require('../models/Log');
const getRazorpay = require('../config/razorpay');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendRefundStatusEmail } = require('../services/emailService');

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/stats
 * @access  Admin
 */
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Revenue stats
  const [totalRevenue, todayRevenue, monthRevenue, yearRevenue] = await Promise.all([
    Payment.aggregate([
      { $match: { status: { $in: ['captured', 'refunded', 'partially_refunded'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: { $in: ['captured', 'refunded', 'partially_refunded'] }, createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: { $in: ['captured', 'refunded', 'partially_refunded'] }, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: { $in: ['captured', 'refunded', 'partially_refunded'] }, createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  // Counts
  const [totalOrders, totalPayments, totalRefunds, pendingRefunds, totalUsers, totalInvoices] =
    await Promise.all([
      Order.countDocuments(),
      Payment.countDocuments(),
      Refund.countDocuments(),
      Refund.countDocuments({ status: 'pending' }),
      User.countDocuments(),
      Invoice.countDocuments(),
    ]);

  // Daily revenue for last 7 days
  const dailyRevenue = await Payment.aggregate([
    {
      $match: {
        status: { $in: ['captured', 'refunded', 'partially_refunded'] },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Monthly revenue for last 6 months
  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: { $in: ['captured', 'refunded', 'partially_refunded'] },
        createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Payment method breakdown
  const methodBreakdown = await Payment.aggregate([
    { $match: { status: { $in: ['captured', 'refunded', 'partially_refunded'] } } },
    { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        month: monthRevenue[0]?.total || 0,
        year: yearRevenue[0]?.total || 0,
      },
      counts: {
        orders: totalOrders,
        payments: totalPayments,
        refunds: totalRefunds,
        pendingRefunds,
        users: totalUsers,
        invoices: totalInvoices,
      },
      dailyRevenue,
      monthlyRevenue,
      methodBreakdown,
    },
  });
});

/**
 * @desc    Get all payments (admin)
 * @route   GET /api/admin/payments
 * @access  Admin
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const status = req.query.status || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { paymentId: { $regex: search, $options: 'i' } },
      { razorpayOrderId: { $regex: search, $options: 'i' } },
      { razorpayPaymentId: { $regex: search, $options: 'i' } },
    ];
  }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('order', 'orderId description'),
    Payment.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/admin/orders
 * @access  Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status || '';
  const search = req.query.search || '';

  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { razorpayOrderId: { $regex: search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email'),
    Order.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

/**
 * @desc    Get all refunds (admin)
 * @route   GET /api/admin/refunds
 * @access  Admin
 */
const getAllRefunds = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status || '';

  const query = {};
  if (status) query.status = status;

  const [refunds, total] = await Promise.all([
    Refund.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
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

/**
 * @desc    Approve a refund
 * @route   PUT /api/admin/refunds/:id/approve
 * @access  Admin
 */
const approveRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, adminNote } = req.body; // action: 'approve' | 'reject'

  const refund = await Refund.findById(id).populate('payment').populate('user', 'name email');
  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  if (refund.status !== 'pending') {
    throw new AppError(`Refund is already ${refund.status}`, 400);
  }

  if (action === 'reject') {
    refund.status = 'rejected';
    refund.adminNote = adminNote || 'Rejected by admin';
    await refund.save();

    // Notify user
    try {
      await sendRefundStatusEmail(refund.user, refund, 'rejected');
    } catch (err) {
      console.error('Refund rejection email failed:', err.message);
    }

    // Log
    await Log.create({
      type: 'admin',
      action: 'refund_rejected',
      user: req.user._id,
      metadata: { refundId: refund.refundId },
      ip: req.ip,
      status: 'success',
    });

    return res.json({ success: true, message: 'Refund rejected', data: { refund } });
  }

  // Approve - process refund via Razorpay
  try {
    const razorpay = getRazorpay();
    const razorpayRefund = await razorpay.payments.refund(refund.payment.razorpayPaymentId, {
      amount: refund.amount,
      notes: { reason: refund.reason, refundId: refund.refundId },
    });

    refund.status = 'approved';
    refund.razorpayRefundId = razorpayRefund.id;
    refund.adminNote = adminNote || 'Approved by admin';
    refund.processedAt = new Date();
    await refund.save();

    // Update payment status
    const payment = refund.payment;
    payment.refundedAmount = (payment.refundedAmount || 0) + refund.amount;
    if (payment.refundedAmount >= payment.amount) {
      payment.status = 'refunded';
    } else {
      payment.status = 'partially_refunded';
    }
    await payment.save();

    // Update order status
    const order = await Order.findById(payment.order);
    if (order) {
      order.status = payment.status === 'refunded' ? 'refunded' : 'partially_refunded';
      await order.save();
    }

    // Notify user
    try {
      await sendRefundStatusEmail(refund.user, refund, 'approved');
    } catch (err) {
      console.error('Refund approval email failed:', err.message);
    }

    // Log
    await Log.create({
      type: 'admin',
      action: 'refund_approved',
      user: req.user._id,
      metadata: { refundId: refund.refundId, razorpayRefundId: razorpayRefund.id },
      ip: req.ip,
      status: 'success',
    });

    res.json({ success: true, message: 'Refund approved and processed', data: { refund } });
  } catch (err) {
    throw new AppError(`Failed to process refund: ${err.message}`, 500);
  }
});

/**
 * @desc    Get all users (admin)
 * @route   GET /api/admin/users
 * @access  Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const role = req.query.role || '';

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

/**
 * @desc    Update a user (admin)
 * @route   PATCH /api/admin/users/:id
 * @access  Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, isActive } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (role && ['customer', 'admin'].includes(role)) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  // Log
  await Log.create({
    type: 'admin',
    action: 'user_updated',
    user: req.user._id,
    metadata: { targetUserId: id },
    ip: req.ip,
    status: 'success',
  });

  res.json({ success: true, message: 'User updated', data: { user } });
});

/**
 * @desc    Delete a user (admin)
 * @route   DELETE /api/admin/users/:id
 * @access  Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user._id.toString()) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.deleteOne();

  // Log
  await Log.create({
    type: 'admin',
    action: 'user_deleted',
    user: req.user._id,
    metadata: { targetUserId: id, targetEmail: user.email },
    ip: req.ip,
    status: 'success',
  });

  res.json({ success: true, message: 'User deleted' });
});

/**
 * @desc    Get logs (admin)
 * @route   GET /api/admin/logs
 * @access  Admin
 */
const getLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const type = req.query.type || '';

  const query = {};
  if (type) query.type = type;

  const [logs, total] = await Promise.all([
    Log.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email'),
    Log.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

module.exports = {
  getStats,
  getAllPayments,
  getAllOrders,
  getAllRefunds,
  approveRefund,
  getAllUsers,
  updateUser,
  deleteUser,
  getLogs,
};