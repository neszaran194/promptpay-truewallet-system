// services/transactionService.js
const { v4: uuidv4 } = require('uuid');
const PromptPayUtils = require('../utils/promptpay');

class TransactionService {
  constructor(database) {
    this.db = database.getDb();
  }

  // Create new transaction
  async createTransaction(userId, amount) {
    const transactionId = uuidv4();
    const randomCents = PromptPayUtils.generateRandomCents();
    const expectedAmount = parseFloat(amount) + (randomCents / 100);
    
    // สร้างเวลาหมดอายุ (5 นาทีจากตอนนี้)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const expiresAtString = expiresAt.toISOString();
    
    console.log('💳 Creating transaction:', {
      transactionId,
      userId,
      originalAmount: amount,
      expectedAmount: expectedAmount.toFixed(2),
      randomCents,
      expiresAt: expiresAtString,
      promptpayPhone: process.env.PROMPTPAY_PHONE
    });
    
    if (!process.env.PROMPTPAY_PHONE) {
      throw new Error('PromptPay phone number not configured');
    }
    
    // สร้าง PromptPay QR string
    const qrString = PromptPayUtils.generatePromptPayQR(process.env.PROMPTPAY_PHONE, expectedAmount);
    
    // สร้าง QR Code image
    const qrCodeDataURL = await PromptPayUtils.generateQRCodeImage(qrString);
    
    // บันทึกลง database
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO transactions (transaction_id, user_id, amount, expected_amount, qr_string, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [transactionId, userId, amount, expectedAmount, qrString, expiresAtString],
        function(err) {
          if (err) {
            console.error('❌ Database error:', err);
            reject(new Error('Database error'));
            return;
          }
          
          console.log('✅ Transaction created successfully:', {
            id: transactionId,
            expectedAmount: expectedAmount.toFixed(2),
            expiresAt: expiresAtString
          });
          
          resolve({
            success: true,
            transactionId,
            amount: parseFloat(amount),
            expectedAmount: expectedAmount.toFixed(2),
            qrString,
            qrCodeDataURL,
            phoneNumber: process.env.PROMPTPAY_PHONE,
            expiresAt: expiresAtString,
            timeoutMinutes: 5,
            timeRemaining: 5 * 60 * 1000,
            debug: {
              qr_length: qrString.length,
              phone_original: process.env.PROMPTPAY_PHONE,
              phone_formatted: process.env.PROMPTPAY_PHONE.startsWith('0') ? 
                '66' + process.env.PROMPTPAY_PHONE.substring(1) : process.env.PROMPTPAY_PHONE
            }
          });
        }
      );
    });
  }

  // Check transaction status
  getTransactionStatus(transactionId, callback) {
    console.log('🔍 Checking transaction status:', transactionId);
    
    this.db.get(
      `SELECT transaction_id, status, amount, expected_amount, created_at, confirmed_at, expires_at,
       CASE 
         WHEN status = 'pending' AND datetime(expires_at) <= datetime('now') THEN 'expired'
         ELSE status
       END as current_status
       FROM transactions WHERE transaction_id = ?`,
      [transactionId],
      (err, transaction) => {
        if (err) {
          console.error('❌ Database error:', err);
          return callback(err, null);
        }
        
        if (!transaction) {
          console.log('❌ Transaction not found:', transactionId);
          return callback(new Error('Transaction not found'), null);
        }
        
        // ถ้าหมดอายุแล้ว อัปเดตสถานะ
        if (transaction.current_status === 'expired' && transaction.status === 'pending') {
          this.db.run(
            `UPDATE transactions SET status = 'expired' WHERE transaction_id = ?`,
            [transactionId]
          );
          transaction.status = 'expired';
        }
        
        const now = new Date();
        const expires = new Date(transaction.expires_at);
        const timeRemaining = Math.max(0, expires - now);
        
        console.log('✅ Transaction status:', {
          status: transaction.current_status,
          timeRemaining: Math.floor(timeRemaining / 1000) + ' seconds'
        });
        
        callback(null, {
          success: true,
          transaction: {
            id: transaction.transaction_id,
            status: transaction.current_status,
            amount: transaction.amount,
            expectedAmount: transaction.expected_amount,
            createdAt: transaction.created_at,
            confirmedAt: transaction.confirmed_at,
            expiresAt: transaction.expires_at,
            timeRemaining: timeRemaining,
            timeRemainingSeconds: Math.floor(timeRemaining / 1000),
            isExpired: timeRemaining <= 0
          }
        });
      }
    );
  }

  // Get transaction history
  getTransactionHistory(userId, limit = 10, offset = 0, callback) {
    console.log('📋 Getting transaction history:', { userId, limit, offset });
    
    this.db.all(
      `SELECT transaction_id, amount, expected_amount, status, created_at, confirmed_at, expires_at,
       CASE 
         WHEN status = 'pending' AND datetime(expires_at) <= datetime('now') THEN 'expired'
         ELSE status
       END as current_status
       FROM transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)],
      (err, transactions) => {
        if (err) {
          console.error('❌ Database error:', err);
          return callback(err, null);
        }
        
        // อัปเดตสถานะที่หมดอายุ
        const expiredIds = transactions
          .filter(tx => tx.current_status === 'expired' && tx.status === 'pending')
          .map(tx => tx.transaction_id);
        
        if (expiredIds.length > 0) {
          this.db.run(
            `UPDATE transactions SET status = 'expired' WHERE transaction_id IN (${expiredIds.map(() => '?').join(',')})`,
            expiredIds
          );
        }
        
        // อัปเดตสถานะใน response
        const updatedTransactions = transactions.map(tx => ({
          ...tx,
          status: tx.current_status
        }));
        
        console.log('✅ Found transactions:', updatedTransactions.length);
        
        callback(null, {
          success: true,
          transactions: updatedTransactions || []
        });
      }
    );
  }

  // Confirm transaction
  confirmTransaction(transactionId, callback) {
    console.log('✅ Confirming transaction:', transactionId);
    
    this.db.run(
      `UPDATE transactions SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [transactionId],
      function(err) {
        if (err) {
          console.error('❌ Error confirming transaction:', err);
          return callback(err);
        }
        
        console.log('✅ Transaction confirmed successfully');
        callback(null);
      }
    );
  }

  // Find matching transaction
  findMatchingTransaction(amount, callback) {
    console.log('💰 Looking for non-expired transaction with amount:', amount);
    
    this.db.get(
      `SELECT * FROM transactions 
       WHERE status = 'pending' 
       AND ABS(expected_amount - ?) < 0.01 
       AND datetime(expires_at) > datetime('now')
       ORDER BY created_at DESC LIMIT 1`,
      [amount],
      (err, transaction) => {
        if (err) {
          console.error('❌ Database error:', err);
          return callback(err, null);
        }
        
        if (!transaction) {
          console.log('❌ No matching non-expired transaction found');
          return callback(null, null);
        }
        
        // ตรวจสอบอีกครั้งว่ายังไม่หมดอายุ
        const now = new Date();
        const expires = new Date(transaction.expires_at);
        
        if (now > expires) {
          console.log('❌ Transaction expired');
          this.db.run(`UPDATE transactions SET status = 'expired' WHERE id = ?`, [transaction.id]);
          return callback(null, null);
        }
        
        console.log('✅ Found matching active transaction');
        callback(null, transaction);
      }
    );
  }

  // Delete transaction
  deleteTransaction(transactionId, callback) {
    console.log('🗑️ Deleting transaction:', transactionId);
    
    this.db.run(
      `DELETE FROM transactions WHERE transaction_id = ?`,
      [transactionId],
      function(err) {
        if (err) {
          console.error('❌ Error deleting transaction:', err);
          return callback(err);
        }
        
        if (this.changes === 0) {
          return callback(new Error('Transaction not found'));
        }
        
        console.log('✅ Transaction deleted successfully');
        callback(null, { 
          success: true,
          message: 'Transaction deleted',
          transactionId
        });
      }
    );
  }

  // Delete all pending transactions
  deleteAllPendingTransactions(callback) {
    console.log('🗑️ Deleting all pending transactions...');
    
    this.db.run(
      `DELETE FROM transactions WHERE status = 'pending'`,
      [],
      function(err) {
        if (err) {
          console.error('❌ Error deleting pending transactions:', err);
          return callback(err);
        }
        
        console.log(`✅ Deleted ${this.changes} pending transactions`);
        callback(null, { 
          success: true,
          message: 'All pending transactions deleted',
          deletedCount: this.changes
        });
      }
    );
  }

  // Get transaction statistics
  getTransactionStats(callback) {
    this.db.all(
      `SELECT 
         status,
         COUNT(*) as count,
         SUM(amount) as total_amount,
         AVG(amount) as avg_amount
       FROM transactions 
       GROUP BY status`,
      [],
      (err, stats) => {
        if (err) {
          return callback(err, null);
        }
        
        this.db.get(
          `SELECT COUNT(*) as expired_count 
           FROM transactions 
           WHERE status = 'pending' 
           AND datetime(expires_at) <= datetime('now')`,
          [],
          (err, expiredCount) => {
            if (err) {
              return callback(err, null);
            }
            
            callback(null, {
              transaction_stats: stats || [],
              expired_pending: expiredCount ? expiredCount.expired_count : 0
            });
          }
        );
      }
    );
  }

  // Log outgoing transaction
  logOutgoingTransaction(bank, smsMessage, amount, timestamp, callback) {
    this.db.run(
      `INSERT INTO outgoing_transactions (bank, sms_message, amount, sms_timestamp) 
       VALUES (?, ?, ?, ?)`,
      [bank, smsMessage, amount, timestamp],
      function(err) {
        if (err) {
          console.error('❌ Error logging outgoing transaction:', err);
          return callback(err);
        } else {
          console.log(`✅ Logged outgoing transaction: ${amount} THB from ${bank}`);
          callback(null);
        }
      }
    );
  }

  // Get outgoing transactions
  getOutgoingTransactions(limit = 10, offset = 0, callback) {
    this.db.all(
      `SELECT * FROM outgoing_transactions 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)],
      (err, transactions) => {
        if (err) {
          console.error('❌ Database error:', err);
          return callback(err, null);
        }
        
        callback(null, {
          success: true,
          outgoing_transactions: transactions || [],
          total: transactions ? transactions.length : 0
        });
      }
    );
  }

  // Get outgoing statistics
  getOutgoingStats(callback) {
    this.db.all(
      `SELECT 
         bank,
         COUNT(*) as transaction_count,
         SUM(amount) as total_amount,
         AVG(amount) as avg_amount,
         MIN(amount) as min_amount,
         MAX(amount) as max_amount
       FROM outgoing_transactions 
       GROUP BY bank`,
      [],
      (err, stats) => {
        if (err) {
          console.error('❌ Database error:', err);
          return callback(err, null);
        }
        
        this.db.get(
          `SELECT 
             COUNT(*) as total_transactions,
             SUM(amount) as total_spent,
             AVG(amount) as avg_spent
           FROM outgoing_transactions`,
          [],
          (err, overall) => {
            if (err) {
              return callback(err, null);
            }
            
            callback(null, {
              success: true,
              by_bank: stats || [],
              overall: overall || {
                total_transactions: 0,
                total_spent: 0,
                avg_spent: 0
              }
            });
          }
        );
      }
    );
  }

  // Reset database
  resetDatabase(callback) {
    console.log('⚠️ Resetting entire database...');
    
    this.db.serialize(() => {
      this.db.run(`DELETE FROM transactions`, [], (err) => {
        if (err) {
          console.error('❌ Error resetting transactions:', err);
          return callback(err);
        }
        
        const deletedTransactions = this.changes;
        
        this.db.run(`DELETE FROM users`, [], (err) => {
          if (err) {
            console.error('❌ Error resetting users:', err);
            return callback(err);
          }
          
          const deletedUsers = this.changes;
          
          this.db.run(`DELETE FROM outgoing_transactions`, [], function(err) {
            if (err) {
              console.error('❌ Error resetting outgoing transactions:', err);
              return callback(err);
            }
            
            console.log(`✅ Database reset: ${deletedTransactions} transactions, ${deletedUsers} users, ${this.changes} outgoing transactions deleted`);
            
            callback(null, { 
              success: true,
              message: 'Database reset successfully',
              deletedTransactions,
              deletedUsers,
              deletedOutgoing: this.changes
            });
          });
        });
      });
    });
  }
}

module.exports = TransactionService;