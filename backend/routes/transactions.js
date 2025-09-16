// routes/transactions.js
const express = require('express');
const router = express.Router();

module.exports = (transactionService, userService) => {
  // Create new transaction
  router.post('/create-transaction', async (req, res) => {
    try {
      const { userId, amount } = req.body;
      
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid user ID or amount' 
        });
      }

      const result = await transactionService.createTransaction(userId, amount);
      res.json(result);

    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  // Check transaction status
  router.get('/transaction-status/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    
    transactionService.getTransactionStatus(transactionId, (err, result) => {
      if (err) {
        if (err.message === 'Transaction not found') {
          return res.status(404).json({ 
            success: false,
            error: 'Transaction not found' 
          });
        }
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      res.json(result);
    });
  });

  // Get transaction history
  router.get('/transactions/:userId', (req, res) => {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    transactionService.getTransactionHistory(userId, limit, offset, (err, result) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      res.json(result);
    });
  });

  // Delete specific transaction
  router.delete('/transaction/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    
    transactionService.deleteTransaction(transactionId, (err, result) => {
      if (err) {
        if (err.message === 'Transaction not found') {
          return res.status(404).json({ 
            success: false,
            error: 'Transaction not found' 
          });
        }
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      res.json(result);
    });
  });

  // Delete all pending transactions
  router.delete('/transactions/pending', (req, res) => {
    transactionService.deleteAllPendingTransactions((err, result) => {
      if (err) {
        console.error('❌ Error deleting pending transactions:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      res.json(result);
    });
  });

  // Get outgoing transactions
  router.get('/outgoing-transactions', (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    
    transactionService.getOutgoingTransactions(limit, offset, (err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      res.json(result);
    });
  });

  // Get outgoing stats
  router.get('/outgoing-stats', (req, res) => {
    transactionService.getOutgoingStats((err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      result.timestamp = new Date().toISOString();
      res.json(result);
    });
  });

  // Get statistics
  router.get('/stats', (req, res) => {
    transactionService.getTransactionStats((err, transactionStats) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      userService.getUserStats((err, userStats) => {
        if (err) {
          return res.status(500).json({ 
            success: false,
            error: 'Database error' 
          });
        }
        
        res.json({
          success: true,
          ...transactionStats,
          user_stats: userStats,
          timestamp: new Date().toISOString()
        });
      });
    });
  });

  // Reset database (development only)
  router.delete('/reset-database', (req, res) => {
    transactionService.resetDatabase((err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      res.json(result);
    });
  });

  return router;
};