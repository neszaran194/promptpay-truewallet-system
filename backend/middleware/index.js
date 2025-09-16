// middleware/index.js
const cors = require('cors');
const express = require('express');

const setupMiddleware = (app) => {
  console.log('🔧 Setting up middleware...');

  // CORS - เพิ่มการรองรับ development และ production
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ];

  // เพิ่ม production origins ถ้ามี
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.use(cors({
    origin: function (origin, callback) {
      // อนุญาต requests ที่ไม่มี origin (เช่น mobile apps, postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
  }));

  // Body parser with enhanced security
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove server fingerprinting
    res.removeHeader('X-Powered-By');
    
    next();
  });

  // Request logging middleware with enhanced info
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    console.log(`📝 ${timestamp} - ${req.method} ${req.path} - IP: ${ip}`);
    
    // Log body for non-sensitive endpoints
    if (req.body && Object.keys(req.body).length > 0) {
      const sensitiveEndpoints = ['/api/sms-webhook', '/api/truewallet/redeem'];
      const isSensitive = sensitiveEndpoints.some(endpoint => req.path.includes(endpoint));
      
      if (!isSensitive) {
        console.log('Body:', req.body);
      } else {
        console.log('Body: [REDACTED - Sensitive endpoint]');
      }
    }
    
    // Log query params if present
    if (Object.keys(req.query).length > 0) {
      console.log('Query:', req.query);
    }
    
    next();
  });

  // Rate limiting middleware (basic implementation)
  const rateLimitMap = new Map();
  app.use('/api', (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // requests per window
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }
    
    const requests = rateLimitMap.get(ip);
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);
    
    res.setHeader('X-Rate-Limit-Remaining', maxRequests - validRequests.length);
    next();
  });

  console.log('✅ Middleware setup completed');
};

// Enhanced error handling middleware
const setupErrorHandling = (app) => {
  // Global error handler
  app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload'
      });
    }
    
    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({
        success: false,
        error: 'CORS policy violation'
      });
    }
    
    // Default error response
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  });
};

// Enhanced 404 handler
const setup404Handler = (app) => {
  app.use((req, res) => {
    console.log('❌ 404 - Route not found:', req.method, req.path);
    res.status(404).json({ 
      success: false,
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        // Core
        'GET /',
        'GET /api/health',
        
        // PromptPay
        'POST /api/create-transaction',
        'POST /api/sms-webhook',
        'GET /api/transaction-status/:id',
        
        // TrueWallet
        'POST /api/truewallet/redeem',
        'GET /api/truewallet/history/:userId',
        'GET /api/truewallet/stats',
        'POST /api/truewallet/validate',
        
        // User Management
        'GET /api/user-credits/:userId',
        'GET /api/transactions/:userId',
        'POST /api/fix-credits/:userId',
        
        // Statistics
        'GET /api/stats',
        'GET /api/payment/stats',
        'GET /api/outgoing-transactions',
        'GET /api/outgoing-stats',
        
        // Management
        'DELETE /api/transactions/pending',
        'DELETE /api/transaction/:transactionId',
        'DELETE /api/reset-database',
        
        // Testing
        'POST /api/test-qr',
        'POST /api/test-sms-parse',
        'POST /api/test-sms-detection',
        'POST /api/test-kbank-detection'
      ]
    });
  });
};

module.exports = {
  setupMiddleware,
  setupErrorHandling,
  setup404Handler
};