const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const { allowedCorsOrigins } = require('./config/env');

const path = require('path');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(compression());
app.use(cors({
  origin: true,           // Cho phép mọi origin
  credentials: true,      // Cho phép gửi cookie/token
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files with Cache-Control (1 year for assets)
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0');
    }
  }
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/services', require('./routes/serviceRoutes'));
app.use('/api/v1/products', require('./routes/productRoutes'));
app.use('/api/v1/tracking', require('./routes/trackingRoutes'));
app.use('/api/v1/bookings', require('./routes/bookingRoutes'));
app.use('/api/v1/orders', require('./routes/orderRoutes'));
app.use('/api/v1/technician', require('./routes/technicianRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));
app.use('/api/v1/categories', require('./routes/categoryRoutes'));
app.use('/api/v1/public', require('./routes/publicRoutes'));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cửa Hàng 118 API is running 🚀' });
});

// ─── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
