// services/userService.js

class UserService {
  constructor(database) {
    this.db = database.getDb();
  }

  // Add credits to user account
  addCreditsToUser(userId, amount, callback) {
    console.log(`💰 Adding ${amount} credits to user ${userId}`);
    
    const creditAmount = parseFloat(amount).toFixed(2);
    console.log(`💰 Processed amount: ${creditAmount}`);
    
    // Create user if doesn't exist
    this.db.run(
      `INSERT OR IGNORE INTO users (user_id, credits) VALUES (?, 0)`,
      [userId],
      (err) => {
        if (err) {
          console.error('Error creating user:', err);
          return callback(err);
        }
        
        // Add credits
        this.db.run(
          `UPDATE users 
           SET credits = ROUND(credits + ?, 2), updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?`,
          [parseFloat(creditAmount), userId],
          function(err) {
            if (err) {
              console.error('Error adding credits:', err);
              return callback(err);
            }
            
            console.log(`✅ Added ${creditAmount} credits to user ${userId}`);
            callback(null);
          }
        );
      }
    );
  }

  // Get user credits
  getUserCredits(userId, callback) {
    console.log('💰 Getting user credits:', userId);
    
    this.db.get(
      `SELECT ROUND(credits, 2) as credits, updated_at FROM users WHERE user_id = ?`,
      [userId],
      (err, user) => {
        if (err) {
          console.error('❌ Database error:', err);
          return callback(err, null);
        }
        
        const credits = user ? parseFloat(user.credits).toFixed(2) : '0.00';
        console.log('✅ User credits:', credits);
        
        callback(null, {
          credits: parseFloat(credits),
          credits_display: credits,
          lastUpdated: user ? user.updated_at : null
        });
      }
    );
  }

  // Fix user credits manually
  fixUserCredits(userId, amount, callback) {
    const fixAmount = parseFloat(amount).toFixed(2);
    console.log(`🔧 Manually setting credits for ${userId} to ${fixAmount}`);
    
    this.db.run(
      `INSERT OR IGNORE INTO users (user_id, credits) VALUES (?, 0)`,
      [userId],
      (err) => {
        if (err) {
          console.error('Error creating user:', err);
          return callback(err);
        }
        
        this.db.run(
          `UPDATE users 
           SET credits = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?`,
          [parseFloat(fixAmount), userId],
          function(err) {
            if (err) {
              console.error('Error updating credits:', err);
              return callback(err);
            }
            
            console.log(`✅ Credits set to ${fixAmount} for user ${userId}`);
            callback(null, { 
              success: true,
              message: 'Credits updated',
              credits: parseFloat(fixAmount)
            });
          }
        );
      }
    );
  }

  // Get user statistics
  getUserStats(callback) {
    this.db.get(
      `SELECT COUNT(*) as total_users, SUM(credits) as total_credits
       FROM users`,
      [],
      (err, userStats) => {
        if (err) {
          return callback(err, null);
        }
        
        callback(null, {
          total_users: userStats ? userStats.total_users : 0,
          total_credits: userStats ? parseFloat(userStats.total_credits || 0).toFixed(2) : '0.00'
        });
      }
    );
  }
}

module.exports = UserService;