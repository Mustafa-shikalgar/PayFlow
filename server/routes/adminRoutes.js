const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllPayments,
  getAllOrders,
  getAllRefunds,
  approveRefund,
  getAllUsers,
  updateUser,
  deleteUser,
  getLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/payments', getAllPayments);
router.get('/orders', getAllOrders);
router.get('/refunds', getAllRefunds);
router.put('/refunds/:id/approve', approveRefund);
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/logs', getLogs);

module.exports = router;