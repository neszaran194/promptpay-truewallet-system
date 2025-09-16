// routes/truewallet.js
const express = require('express');
const router = express.Router();

module.exports = (truewalletService, userService) => {
  // Redeem TrueWallet voucher
  router.post('/truewallet/redeem', async (req, res) => {
    try {
      const { userId, voucherCode } = req.body;
      
      if (!userId || !voucherCode) {
        return res.status(400).json({
          success: false,
          error: 'กรุณาระบุ User ID และโค้ดซองอั่งเปา'
        });
      }

      console.log(`🎁 Processing voucher redemption for user: ${userId}`);
      
      const result = await truewalletService.redeemVoucher(userId, voucherCode);
      
      res.json({
        success: true,
        message: 'แลกซองอั่งเปาสำเร็จ',
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Voucher redemption error:', error.message);
      
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get voucher history for user
  router.get('/truewallet/history/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 10, offset = 0 } = req.query;
      
      const history = await truewalletService.getVoucherHistory(userId, limit, offset);
      
      res.json({
        success: true,
        history: history,
        total: history.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get voucher history error:', error);
      res.status(500).json({
        success: false,
        error: 'ไม่สามารถดึงประวัติการแลกซองได้'
      });
    }
  });

  // Get voucher statistics (admin)
  router.get('/truewallet/stats', async (req, res) => {
    try {
      const stats = await truewalletService.getVoucherStats();
      
      res.json({
        success: true,
        stats: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get voucher stats error:', error);
      res.status(500).json({
        success: false,
        error: 'ไม่สามารถดึงสถิติการแลกซองได้'
      });
    }
  });

  // Get recent vouchers (admin)
  router.get('/truewallet/recent', async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      
      const recent = await truewalletService.getRecentVouchers(limit);
      
      res.json({
        success: true,
        recent_vouchers: recent,
        total: recent.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get recent vouchers error:', error);
      res.status(500).json({
        success: false,
        error: 'ไม่สามารถดึงข้อมูลซองล่าสุดได้'
      });
    }
  });

  // Test voucher validation without redemption
  router.post('/truewallet/validate', (req, res) => {
    try {
      const { voucherCode } = req.body;
      
      if (!voucherCode) {
        return res.status(400).json({
          success: false,
          error: 'กรุณาระบุโค้ดซองอั่งเปา'
        });
      }

      const result = truewalletService.testVoucherValidation(voucherCode);
      
      res.json(result);

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'ไม่สามารถตรวจสอบโค้ดซองได้'
      });
    }
  });

  // Get combined payment methods stats
  router.get('/payment/stats', async (req, res) => {
    try {
      // Get voucher stats
      const voucherStats = await truewalletService.getVoucherStats();
      
      // Get user credits
      userService.getUserStats((err, userStats) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'ไม่สามารถดึงสถิติผู้ใช้ได้'
          });
        }

        res.json({
          success: true,
          payment_methods: {
            truewallet: {
              total_redeemed: voucherStats.total_redeemed || 0,
              total_amount: voucherStats.total_amount || 0,
              avg_amount: voucherStats.avg_amount || 0
            },
            promptpay: {
              // This would need to be implemented in transaction service
              note: 'PromptPay stats available in /api/stats'
            }
          },
          users: userStats,
          timestamp: new Date().toISOString()
        });
      });

    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        error: 'ไม่สามารถดึงสถิติการชำระเงินได้'
      });
    }
  });

  return router;
};