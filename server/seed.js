const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Refund = require('./models/Refund');
const Invoice = require('./models/Invoice');
const Log = require('./models/Log');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

const seedData = async () => {
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Refund.deleteMany({}),
      Invoice.deleteMany({}),
      Log.deleteMany({}),
    ]);

    // Create admin
    console.log('👤 Creating admin user...');
    await User.create({
      name: 'Admin User',
      email: 'admin@payflow.com',
      password: 'Admin@123',
      phone: '+91 98765 43210',
      role: 'admin',
      isEmailVerified: true,
    });

    // Create customers
    console.log('👥 Creating customer users...');
    const customers = [];
    const customerData = [
      { name: 'John Doe', email: 'john@example.com', phone: '+91 91234 56780' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '+91 92345 67890' },
      { name: 'Bob Johnson', email: 'bob@example.com', phone: '+91 93456 78901' },
      { name: 'Alice Brown', email: 'alice@example.com', phone: '+91 94567 89012' },
      { name: 'Charlie Wilson', email: 'charlie@example.com', phone: '+91 95678 90123' },
    ];

    for (const data of customerData) {
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: 'Customer@123',
        phone: data.phone,
        role: 'customer',
        isEmailVerified: true,
      });
      customers.push(user);
    }

    // Create orders and payments
    console.log('💳 Creating sample orders and payments...');
    const methods = ['card', 'upi', 'netbanking', 'wallet'];
    const statuses = ['captured', 'captured', 'captured', 'refunded', 'failed'];
    const descriptions = [
      'Premium Subscription',
      'Pro Plan - Annual',
      'Enterprise License',
      'Consulting Services',
      'Cloud Storage Add-on',
      'API Access Package',
      'Team Collaboration Plan',
      'Data Analytics Suite',
    ];

    const payments = [];
    const orders = [];

    for (let i = 0; i < 20; i++) {
      const customer = customers[i % customers.length];
      const amount = [49900, 99900, 199900, 499900, 99900, 149900, 299900, 79900][i % 8];
      const method = methods[i % methods.length];
      const status = statuses[i % statuses.length];
      const description = descriptions[i % descriptions.length];

      const order = await Order.create({
        orderId: generateId('ORD'),
        amount,
        currency: 'INR',
        status: status === 'captured' || status === 'refunded' ? 'paid' : status,
        user: customer._id,
        razorpayOrderId: `order_${Date.now()}_${i}`,
        description,
      });
      orders.push(order);

      if (status !== 'failed') {
        const payment = await Payment.create({
          paymentId: generateId('PAY'),
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: `pay_${Date.now()}_${i}`,
          signature: `sig_${Date.now()}_${i}`,
          order: order._id,
          user: customer._id,
          amount,
          currency: 'INR',
          status: status === 'refunded' ? 'refunded' : 'captured',
          method,
          description,
          idempotencyKey: `pay_${Date.now()}_${i}`,
          refundedAmount: status === 'refunded' ? amount : 0,
        });
        payments.push(payment);

        // Create invoice for captured payments
        if (status === 'captured') {
          await Invoice.create({
            invoiceNumber: `INV-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
            payment: payment._id,
            user: customer._id,
            pdfUrl: '',
            pdfPath: '',
            amount,
            currency: 'INR',
          });
        }
      }
    }

    // Create refunds
    console.log('🔄 Creating sample refunds...');
    const refundReasons = [
      'Duplicate payment made',
      'Service not as described',
      'Cancelled subscription',
      'Accidental payment',
      'Product not delivered',
    ];

    for (let i = 0; i < 5; i++) {
      const payment = payments[i * 2];
      if (payment) {
        const status = i < 2 ? 'pending' : i < 4 ? 'approved' : 'rejected';
        await Refund.create({
          refundId: generateId('REF'),
          payment: payment._id,
          user: payment.user,
          reason: refundReasons[i % refundReasons.length],
          amount: payment.amount,
          status,
          adminNote: status === 'approved' ? 'Approved by admin' : status === 'rejected' ? 'Rejected by admin' : undefined,
          processedAt: status !== 'pending' ? new Date() : undefined,
        });
      }
    }

    // Create logs
    console.log('📝 Creating sample logs...');
    await Log.create({
      type: 'system',
      action: 'seed_data_created',
      metadata: { users: customers.length + 1, orders: orders.length, payments: payments.length },
      status: 'success',
    });

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📋 Default Users:');
    console.log('─────────────────────────────────────');
    console.log('Admin:    admin@payflow.com / Admin@123');
    console.log('Customer: john@example.com / Customer@123');
    console.log('─────────────────────────────────────');
    console.log('\n💡 Use test card 4111 1111 1111 1111 for Razorpay test payments.\n');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

const run = async () => {
  await connectDB();
  await seedData();
};

run();