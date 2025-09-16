// config/database.js
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

class Database {
  constructor() {
    this.dbPath = process.env.DB_PATH || './transactions.db';
    this.db = new sqlite3.Database(this.dbPath);
    this.initialize();
  }

  initialize() {
    console.log('🗄️ Setting up database...');
    
    this.db.serialize(() => {
      // Transactions table (PromptPay)
      this.db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id VARCHAR(50) UNIQUE,
        user_id VARCHAR(50),
        amount DECIMAL(10,2),
        expected_amount DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        qr_string TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmed_at DATETIME
      )`);
      
      // Users table
      this.db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(50) UNIQUE,
        credits DECIMAL(10,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // Outgoing transactions table (SMS tracking)
      this.db.run(`CREATE TABLE IF NOT EXISTS outgoing_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank VARCHAR(50),
        sms_message TEXT,
        amount DECIMAL(10,2),
        sms_timestamp BIGINT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // TrueWallet voucher transactions table
      this.db.run(`CREATE TABLE IF NOT EXISTS voucher_transactions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        voucher_code TEXT,
        amount DECIMAL(10,2),
        owner_name VARCHAR(255),
        message TEXT,
        type VARCHAR(20), -- 'code' or 'url'
        status VARCHAR(20) DEFAULT 'completed',
        redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Failed voucher attempts table
      this.db.run(`CREATE TABLE IF NOT EXISTS failed_vouchers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(50),
        voucher_code TEXT,
        error_message TEXT,
        attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Payment methods preference table
      this.db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(50) UNIQUE,
        preferred_payment_method VARCHAR(20) DEFAULT 'promptpay', -- 'promptpay', 'truewallet', 'both'
        notification_enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // Add expires_at column if it doesn't exist (migration)
      this.db.run(`ALTER TABLE transactions ADD COLUMN expires_at DATETIME`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.log('Adding expires_at column...');
        }
      });

      // Add indexes for better performance
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_voucher_transactions_user_id ON voucher_transactions(user_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_voucher_transactions_code ON voucher_transactions(voucher_code)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id)`);
      
      console.log('✅ Database initialized successfully');
    });
  }

  getDb() {
    return this.db;
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err);
          reject(err);
        } else {
          console.log('✅ Database connection closed');
          resolve();
        }
      });
    });
  }

  // Auto cleanup expired transactions
  startAutoCleanup() {
    setInterval(() => {
      console.log('🧹 Auto cleanup expired transactions...');
      
      this.db.run(
        `UPDATE transactions 
         SET status = 'expired' 
         WHERE status = 'pending' 
         AND datetime(expires_at) <= datetime('now')`,
        [],
        function(err) {
          if (!err && this.changes > 0) {
            console.log(`✅ Auto expired ${this.changes} transactions`);
          }
        }
      );
    }, 60 * 1000); // ทุก 1 นาที
  }

  // Get database statistics
  getStats() {
    return new Promise((resolve, reject) => {
      const stats = {};

      // Get transaction stats
      this.db.all(
        `SELECT 
           status,
           COUNT(*) as count,
           SUM(amount) as total_amount
         FROM transactions 
         GROUP BY status`,
        [],
        (err, transactionStats) => {
          if (err) return reject(err);

          // Get voucher stats
          this.db.get(
            `SELECT 
               COUNT(*) as total_vouchers,
               SUM(amount) as total_voucher_amount
             FROM voucher_transactions 
             WHERE status = 'completed'`,
            [],
            (err, voucherStats) => {
              if (err) return reject(err);

              // Get user stats
              this.db.get(
                `SELECT 
                   COUNT(*) as total_users,
                   SUM(credits) as total_credits
                 FROM users`,
                [],
                (err, userStats) => {
                  if (err) return reject(err);

                  resolve({
                    transactions: transactionStats || [],
                    vouchers: voucherStats || { total_vouchers: 0, total_voucher_amount: 0 },
                    users: userStats || { total_users: 0, total_credits: 0 },
                    timestamp: new Date().toISOString()
                  });
                }
              );
            }
          );
        }
      );
    });
  }
}

module.exports = Database;