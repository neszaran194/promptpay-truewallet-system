// services/truewalletService.js
// Import tw-voucher with error handling
let twvoucher;
try {
  // Try different import methods
  const twvoucherModule = require('@fortune-inc/tw-voucher');
  console.log('tw-voucher module:', typeof twvoucherModule, Object.keys(twvoucherModule));
  
  // Try different ways to access the function
  twvoucher = twvoucherModule.twvoucher || 
              twvoucherModule.default || 
              twvoucherModule || 
              (typeof twvoucherModule === 'function' ? twvoucherModule : null);
              
  if (!twvoucher || typeof twvoucher !== 'function') {
    throw new Error('twvoucher function not found in module');
  }
  
  console.log('✅ tw-voucher imported successfully');
} catch (error) {
  console.error('❌ Error importing tw-voucher:', error.message);
  console.error('Please install: npm install @fortune-inc/tw-voucher');
}
const { v4: uuidv4 } = require('uuid');

class TrueWalletService {
  constructor(database) {
    this.db = database.getDb();
    this.phoneNumber = process.env.TRUEWALLET_PHONE;
  }

  // Validate voucher code format
  validateVoucherCode(voucherCode) {
    // Remove whitespace
    const cleanCode = voucherCode.trim();
    
    // Check if it's a URL format
    if (cleanCode.includes('gift.truemoney.com')) {
      return {
        isValid: true,
        type: 'url',
        code: cleanCode
      };
    }
    
    // Check if it's a direct voucher code
    if (cleanCode.length >= 16 && /^[a-zA-Z0-9]+$/.test(cleanCode)) {
      return {
        isValid: true,
        type: 'code',
        code: cleanCode
      };
    }
    
    return {
      isValid: false,
      type: 'unknown',
      code: cleanCode
    };
  }

  // Redeem voucher and add credits to user
  async redeemVoucher(userId, voucherCode) {
    // Check if tw-voucher is available
    if (!twvoucher || typeof twvoucher !== 'function') {
      throw new Error('ไม่สามารถเข้าถึง TrueWallet voucher service ได้ กรุณาติดต่อผู้ดูแลระบบ');
    }

    const validation = this.validateVoucherCode(voucherCode);
    
    if (!validation.isValid) {
      throw new Error('รูปแบบโค้ดซองอั่งเปาไม่ถูกต้อง');
    }

    if (!this.phoneNumber) {
      throw new Error('เบอร์ TrueWallet ไม่ได้ตั้งค่าไว้');
    }

    console.log(`🎁 Attempting to redeem voucher for user ${userId}`);
    console.log(`📱 TrueWallet Phone: ${this.phoneNumber}`);
    console.log(`🎫 Voucher Code Type: ${validation.type}`);

    try {
      // Check if voucher already used
      const existingVoucher = await this.checkVoucherUsed(validation.code);
      if (existingVoucher) {
        throw new Error('โค้ดซองอั่งเปานี้ถูกใช้ไปแล้ว');
      }

      // Redeem voucher using tw-voucher library
      console.log('🔄 Calling tw-voucher function...');
      const redeemed = await twvoucher(this.phoneNumber, validation.code);
      
      console.log('✅ Voucher redeemed successfully:', {
        code: redeemed.code,
        amount: redeemed.amount,
        owner: redeemed.owner_full_name,
        message: redeemed.message || 'ไม่มีข้อความ'
      });

      // Create voucher transaction record
      const voucherTransaction = {
        id: uuidv4(),
        user_id: userId,
        voucher_code: validation.code,
        amount: redeemed.amount,
        owner_name: redeemed.owner_full_name,
        message: redeemed.message || null,
        type: validation.type,
        status: 'completed',
        redeemed_at: new Date().toISOString()
      };

      // Save to database
      await this.saveVoucherTransaction(voucherTransaction);

      // Add credits to user
      await this.addCreditsToUser(userId, redeemed.amount);

      return {
        success: true,
        transaction: voucherTransaction,
        voucher_info: {
          code: redeemed.code,
          amount: redeemed.amount,
          owner_full_name: redeemed.owner_full_name,
          message: redeemed.message
        }
      };

    } catch (error) {
      console.error('❌ Voucher redemption failed:', error.message);
      
      // Log failed attempt
      await this.logFailedVoucher(userId, validation.code, error.message);
      
      // Return user-friendly error messages based on specific error codes
      if (error.message === 'VOUCHER_OUT_OF_STOCK') {
        throw new Error('ซองอั่งเปานี้หมดแล้วหรือถูกแลกไปแล้ว');
      } else if (error.message === 'INVAILD_VOUCHER' || error.message === 'INVALID_VOUCHER') {
        throw new Error('โค้ดซองอั่งเปาไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else if (error.message === 'VOUCHER_EXPIRED') {
        throw new Error('ซองอั่งเปานี้หมดอายุแล้ว');
      } else if (error.message === 'VOUCHER_NOT_FOUND') {
        throw new Error('ไม่พบซองอั่งเปานี้ กรุณาตรวจสอบโค้ดอีกครั้ง');
      } else if (error.message === 'INVALID_PHONE_NUMBER') {
        throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง');
      } else if (error.message === 'VOUCHER_ALREADY_REDEEMED') {
        throw new Error('ซองอั่งเปานี้ถูกใช้ไปแล้ว');
      } else if (error.message === 'INSUFFICIENT_BALANCE') {
        throw new Error('ยอดเงินในซองไม่เพียงพอ');
      } else if (error.message === 'SYSTEM_ERROR') {
        throw new Error('ระบบ TrueWallet ขัดข้อง กรุณาลองใหม่ภายหลัง');
      } else if (error.message === 'TARGET_USER_REDEEMED') {
        throw new Error('ซองอั่งเปานี้ได้รับการแลกโดยเบอร์เป้าหมายแล้ว');
      } else if (error.message === 'CANNOT_GET_OWN_VOUCHER') {
        throw new Error('ไม่สามารถแลกซองที่ตัวเองสร้างได้ กรุณาใช้ซองจากคนอื่น');
      } else if (error.message === 'RATE_LIMIT_EXCEEDED') {
        throw new Error('แลกซองเร็วเกินไป กรุณารอสักครู่แล้วลองใหม่');
      } else if (error.message.includes('Invalid voucher') || error.message.includes('not found')) {
        throw new Error('โค้ดซองอั่งเปาไม่ถูกต้องหรือหมดอายุแล้ว');
      } else if (error.message.includes('already used') || error.message.includes('redeemed')) {
        throw new Error('โค้ดซองอั่งเปานี้ถูกใช้ไปแล้ว');
      } else if (error.message.includes('phone number')) {
        throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        throw new Error('เชื่อมต่อเครือข่ายล้มเหลว กรุณาลองใหม่อีกครั้ง');
      } else {
        // Log original error for debugging
        console.error('Unhandled voucher error:', error);
        throw new Error(`ไม่สามารถแลกซองได้: ${error.message}`);
      }
    }
  }

  // Check if voucher code was already used
  checkVoucherUsed(voucherCode) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM voucher_transactions WHERE voucher_code = ? AND status = "completed"',
        [voucherCode],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  // Save voucher transaction to database
  saveVoucherTransaction(transaction) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO voucher_transactions 
         (id, user_id, voucher_code, amount, owner_name, message, type, status, redeemed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.user_id,
          transaction.voucher_code,
          transaction.amount,
          transaction.owner_name,
          transaction.message,
          transaction.type,
          transaction.status,
          transaction.redeemed_at
        ],
        function(err) {
          if (err) {
            console.error('Database error saving voucher transaction:', err);
            reject(err);
          } else {
            console.log(`✅ Voucher transaction saved with ID: ${transaction.id}`);
            resolve(this.lastID);
          }
        }
      );
    });
  }

  // Log failed voucher attempts
  logFailedVoucher(userId, voucherCode, errorMessage) {
    return new Promise((resolve) => {
      this.db.run(
        `INSERT INTO failed_vouchers 
         (user_id, voucher_code, error_message, attempted_at)
         VALUES (?, ?, ?, ?)`,
        [userId, voucherCode, errorMessage, new Date().toISOString()],
        function(err) {
          if (err) {
            console.error('Error logging failed voucher:', err);
          }
          resolve();
        }
      );
    });
  }

  // Add credits to user account
  addCreditsToUser(userId, amount) {
    return new Promise((resolve, reject) => {
      const creditAmount = parseFloat(amount).toFixed(2);
      
      // Create user if doesn't exist
      this.db.run(
        'INSERT OR IGNORE INTO users (user_id, credits) VALUES (?, 0)',
        [userId],
        (err) => {
          if (err) {
            return reject(err);
          }
          
          // Add credits
          this.db.run(
            `UPDATE users 
             SET credits = ROUND(credits + ?, 2), updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = ?`,
            [parseFloat(creditAmount), userId],
            function(err) {
              if (err) {
                reject(err);
              } else {
                console.log(`💰 Added ${creditAmount} credits to user ${userId} from TrueWallet voucher`);
                resolve();
              }
            }
          );
        }
      );
    });
  }

  // Get voucher transaction history for user
  getVoucherHistory(userId, limit = 10, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM voucher_transactions 
         WHERE user_id = ? 
         ORDER BY redeemed_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  // Get voucher statistics
  getVoucherStats() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
           COUNT(*) as total_redeemed,
           SUM(amount) as total_amount,
           AVG(amount) as avg_amount,
           MIN(amount) as min_amount,
           MAX(amount) as max_amount
         FROM voucher_transactions 
         WHERE status = 'completed'`,
        [],
        (err, stats) => {
          if (err) {
            reject(err);
          } else {
            resolve(stats[0] || {
              total_redeemed: 0,
              total_amount: 0,
              avg_amount: 0,
              min_amount: 0,
              max_amount: 0
            });
          }
        }
      );
    });
  }

  // Get recent vouchers for admin
  getRecentVouchers(limit = 20) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
           v.*,
           u.credits as user_current_credits
         FROM voucher_transactions v
         LEFT JOIN users u ON v.user_id = u.user_id
         WHERE v.status = 'completed'
         ORDER BY v.redeemed_at DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  // Test voucher validation without redemption
  testVoucherValidation(voucherCode) {
    const validation = this.validateVoucherCode(voucherCode);
    
    return {
      success: true,
      validation: validation,
      phone_number: this.phoneNumber,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = TrueWalletService;