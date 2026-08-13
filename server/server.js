const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import middleware
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ─── Trust proxy ─────────────────────────────────────────────────────────────
// Render sits behind a reverse proxy that sets the X-Forwarded-For header.
// express-rate-limit v7 throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR when that
// header is present but Express `trust proxy` is false (the default).
// Setting it to the number of proxy hops (1 on Render) fixes the error while
// remaining safe (NOT the permissive boolean `true`).
// Override with the TRUST_PROXY environment variable if needed.
const trustProxy = Number(process.env.TRUST_PROXY || 1);
app.set('trust proxy', Number.isFinite(trustProxy) ? trustProxy : 1);

// Security headers
app.use(helmet());

// CORS — FIX: support an array of allowed origins so Vercel preview URLs also work.
// CLIENT_URL can be a comma-separated list, e.g.:
//   CLIENT_URL=https://pay-flow-smoky.vercel.app,https://pay-flow-git-main.vercel.app
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Render health checks, curl, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked for origin: ${origin}`);
      return callback(new Error(`CORS policy: origin ${origin} is not allowed`), false);
    },
    credentials: true,
  })
);

// Request logging — always on so Render production logs show request details
app.use(morgan('dev'));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Sanitize against XSS
app.use(xss());

// Static files (uploads)
// NOTE: Render's filesystem is ephemeral — files written to /uploads do NOT
// persist across deploys/restarts. For production avatar/invoice persistence
// use object storage (e.g. Cloudinary/S3) instead of the local disk.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root / health response (fixes GET / returning 404)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PayFlow API is running',
    service: 'PayFlow API',
    health: '/api/health',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PayFlow API is running', timestamp: new Date().toISOString() });
});

// API rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`🚀 PayFlow API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
      // Force exit after 10s if connections don't close
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();