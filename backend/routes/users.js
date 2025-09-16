// routes/users.js
const express = require('express');
const router = express.Router();

module.exports = (userService) => {
  // Get user credits
  router.get('/user-credits/:userId', (req, res) => {
    const { userId } = req.params;
    
    userService.getUserCredits(userId, (err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          error: 'Database error' 
        });
      }
      
      res.json({
        success: true,
        ...result
      });
    });
  });

  // Fix user credits manually
  router.post('/fix-credits/:userId', (req, res) => {
    const { userId } = req.params;
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Amount required' 
      });
    }
    
    userService.fixUserCredits(userId, amount, (err, result) => {
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