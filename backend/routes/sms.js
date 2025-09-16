// routes/sms.js
const express = require('express');
const router = express.Router();
const SMSParser = require('../utils/smsParser');

module.exports = (transactionService, userService) => {
  // SMS Webhook endpoint
  router.post('/sms-webhook', (req, res) => {
    console.log('📱 SMS webhook received');
    
    try {
      const { from, message, text, timestamp } = req.body;
      console.log('SMS data:', req.body);
      
      // รองรับทั้ง "message" และ "text" field
      const smsMessage = message || text;
      
      if (!smsMessage) {
        console.log('❌ No message or text field provided');
        return res.status(400).json({ 
          success: false,
          error: 'No message provided',
          received: req.body
        });
      }
      
      console.log('🔍 Processing SMS message:', smsMessage);
      console.log('📤 Message length:', smsMessage.length, 'chars');
      console.log('📤 Contains question marks:', smsMessage.includes('?'));
      
      // ตรวจสอบประเภทของ SMS
      const transactionType = SMSParser.detectTransactionType(smsMessage);
      console.log('💳 Transaction type detected:', transactionType);
      
      // ถ้าเป็นเงินออก ให้ log ไว้แต่ไม่ process
      if (transactionType === 'outgoing') {
        console.log('💸 Outgoing transaction detected - logging for future use');
        
        const outgoingAmount = SMSParser.parseAmountFromSMS(smsMessage);
        
        if (outgoingAmount) {
          // Log เงินออกลง database
          transactionService.logOutgoingTransaction(from, smsMessage, outgoingAmount, timestamp, (err) => {
            if (err) {
              console.error('Error logging outgoing transaction:', err);
            }
          });
          
          return res.json({
            success: true,
            message: 'Outgoing transaction logged',
            type: 'outgoing',
            amount: outgoingAmount,
            bank: from,
            logged_for_future_use: true,
            detection_method: smsMessage.includes('?') ? 'curl_pattern' : 'thai_text'
          });
        } else {
          return res.json({
            success: true,
            message: 'Outgoing transaction detected but amount not parsed',
            type: 'outgoing',
            bank: from,
            logged_for_future_use: false,
            raw_message: smsMessage
          });
        }
      }
      
      // ถ้าไม่ใช่เงินเข้า ให้ skip
      if (transactionType !== 'incoming') {
        console.log('ℹ️ SMS is not incoming transaction:', transactionType);
        return res.json({
          success: true,
          message: 'SMS processed but not incoming transaction',
          type: transactionType,
          bank: from,
          detection_method: smsMessage.includes('?') ? 'curl_pattern' : 'thai_text'
        });
      }
      
      // ประมวลผลเงินเข้าตามปกติ
      const receivedAmount = SMSParser.parseAmountFromSMS(smsMessage);
      
      if (!receivedAmount) {
        console.log('❌ Amount not found in SMS:', smsMessage);
        return res.status(400).json({ 
          success: false,
          error: 'Amount not found in SMS',
          message: smsMessage,
          type: transactionType
        });
      }
      
      // หา transaction ที่ตรงกันและยังไม่หมดอายุ
      transactionService.findMatchingTransaction(receivedAmount, (err, transaction) => {
        if (err) {
          console.error('❌ Database error:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Database error' 
          });
        }
        
        if (!transaction) {
          console.log('❌ No matching non-expired transaction found');
          return res.status(404).json({ 
            success: false,
            error: 'No matching active transaction found',
            received_amount: receivedAmount,
            sms_from: from,
            type: transactionType,
            detection_method: smsMessage.includes('?') ? 'curl_pattern' : 'thai_text'
          });
        }
        
        // อัปเดตสถานะเป็น confirmed
        transactionService.confirmTransaction(transaction.id, (err) => {
          if (err) {
            console.error('❌ Error confirming transaction:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
          }
          
          // เพิ่มเครดิต
          userService.addCreditsToUser(transaction.user_id, receivedAmount, (creditsErr) => {
            if (creditsErr) {
              console.error('❌ Error adding credits:', creditsErr);
              return res.status(500).json({ success: false, error: 'Error adding credits' });
            }
            
            console.log(`✅ Transaction ${transaction.transaction_id} confirmed for ${receivedAmount} THB`);
            
            res.json({ 
              success: true,
              message: 'Transaction confirmed',
              transactionId: transaction.transaction_id,
              original_amount: transaction.amount,
              received_amount: receivedAmount,
              credited_amount: receivedAmount,
              sms_message: smsMessage,
              bank: from,
              type: 'incoming',
              detection_method: smsMessage.includes('?') ? 'curl_pattern' : 'thai_text',
              confirmed_at: new Date().toISOString()
            });
          });
        });
      });
    } catch (error) {
      console.error('❌ SMS webhook error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  return router;
};