// server.js - Main server file with PromptPay & TrueWallet support
const express = require('express');
require('dotenv').config();

// Import components
const Database = require('./config/database');
const UserService = require('./services/userService');
const TransactionService = require('./services/transactionService');
const TrueWalletService = require('./services/truewalletService');
const { setupMiddleware, setupErrorHandling, setup404Handler } = require('./middleware');

// Import routes
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');
const smsRoutes = require('./routes/sms');
const truewalletRoutes = require('./routes/truewallet');
const testRoutes = require('./routes/test');

const app = express();

// ===== SETUP =====
console.log('🚀 Starting PromptPay & TrueWallet Backend Server...');

// Setup middleware
setupMiddleware(app);

// Setup database
const database = new Database();

// Setup services
const userService = new UserService(database);
const transactionService = new TransactionService(database);
const truewalletService = new TrueWalletService(database);

// Validate configuration
if (!process.env.PROMPTPAY_PHONE) {
  console.warn('⚠️ PROMPTPAY_PHONE not configured in .env');
}

if (!process.env.TRUEWALLET_PHONE) {
  console.warn('⚠️ TRUEWALLET_PHONE not configured in .env');
}

// ===== ROUTES =====
console.log('🛤️ Setting up routes...');

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'PromptPay & TrueWallet API Server',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    features: [
      'PromptPay QR Code Generation',
      'TrueWallet Voucher Redemption',
      'SMS Transaction Detection',
      'User Credit Management',
      'Real-time Transaction Status'
    ],
    endpoints: [
      'GET /api/health',
      'POST /api/create-transaction',
      'POST /api/sms-webhook',
      'GET /api/transaction-status/:id',
      'GET /api/user-credits/:userId',
      'GET /api/transactions/:userId',
      'POST /api/truewallet/redeem',
      'GET /api/truewallet/history/:userId',
      'GET /api/truewallet/stats',
      'POST /api/truewallet/validate',
      'GET /api/payment/stats',
      'DELETE /api/transactions/pending',
      'DELETE /api/transaction/:transactionId',
      'POST /api/fix-credits/:userId',
      'GET /api/stats'
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  
  // Test database connection
  database.getDb().get('SELECT 1 as test', (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ 
      success: true, 
      message: 'PromptPay & TrueWallet API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      configuration: {
        promptpay_phone: process.env.PROMPTPAY_PHONE ? 'configured' : 'missing',
        truewallet_phone: process.env.TRUEWALLET_PHONE ? 'configured' : 'missing',
        environment: process.env.NODE_ENV || 'development'
      },
      features: {
        promptpay: !!process.env.PROMPTPAY_PHONE,
        truewallet: !!process.env.TRUEWALLET_PHONE,
        sms_webhook: true,
        auto_cleanup: true
      }
    });
  });
});

// Setup API routes
app.use('/api', transactionRoutes(transactionService, userService));
app.use('/api', userRoutes(userService));
app.use('/api', smsRoutes(transactionService, userService));
app.use('/api', truewalletRoutes(truewalletService, userService));
app.use('/api', testRoutes());

// Setup error handling (must be after routes)
setupErrorHandling(app);

// Setup 404 handler (must be last)
setup404Handler(app);

// ===== AUTO CLEANUP =====
database.startAutoCleanup();

// ===== START SERVER =====
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 PromptPay & TrueWallet Backend Server Started!');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📱 PromptPay Phone: ${process.env.PROMPTPAY_PHONE || 'Not configured'}`);
  console.log(`🎁 TrueWallet Phone: ${process.env.TRUEWALLET_PHONE || 'Not configured'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ Database: ${process.env.DB_PATH || './transactions.db'}`);
  console.log(`⏰ Transaction timeout: 5 minutes`);
  console.log(`🧹 Auto cleanup: Every 1 minute`);
  console.log(`🏦 Enhanced SMS detection with KBank support`);
  console.log(`📦 TrueWallet voucher redemption enabled`);
  console.log('\n📋 Available endpoints:');
  console.log('  === Core ===');
  console.log('  GET  /               - Server info');
  console.log('  GET  /api/health     - Health check');
  console.log('  === PromptPay ===');
  console.log('  POST /api/create-transaction - Create new transaction');
  console.log('  POST /api/sms-webhook - SMS webhook endpoint');
  console.log('  GET  /api/transaction-status/:id - Check transaction status');
  console.log('  === TrueWallet ===');
  console.log('  POST /api/truewallet/redeem - Redeem voucher');
  console.log('  GET  /api/truewallet/history/:userId - Voucher history');
  console.log('  GET  /api/truewallet/stats - Voucher statistics');
  console.log('  POST /api/truewallet/validate - Validate voucher code');
  console.log('  === User Management ===');
  console.log('  GET  /api/user-credits/:userId - Get user credits');
  console.log('  GET  /api/transactions/:userId - Get transaction history');
  console.log('  POST /api/fix-credits/:userId - Fix user credits manually');
  console.log('  === Statistics ===');
  console.log('  GET  /api/stats - Get system statistics');
  console.log('  GET  /api/payment/stats - Get payment method stats');
  console.log('  === Management ===');
  console.log('  DELETE /api/transactions/pending - Delete all pending transactions');
  console.log('  DELETE /api/transaction/:id - Delete specific transaction');
  console.log('  DELETE /api/reset-database - Reset entire database');
  console.log('  === Testing ===');
  console.log('  POST /api/test-qr - Test QR generation');
  console.log('  POST /api/test-sms-detection - Test SMS detection');
  console.log('  POST /api/test-kbank-detection - Test KBank detection');
  console.log('\n✅ Ready to receive requests!\n');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n⛔ Received ${signal}, shutting down gracefully...`);
  database.close()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));