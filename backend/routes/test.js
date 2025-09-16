// routes/test.js
const express = require('express');
const router = express.Router();
const PromptPayUtils = require('../utils/promptpay');
const SMSParser = require('../utils/smsParser');

module.exports = () => {
  // Test QR generation
  router.post('/test-qr', async (req, res) => {
    try {
      const { phone, amount } = req.body;
      
      if (!phone || !amount) {
        return res.status(400).json({ 
          success: false,
          error: 'Phone and amount required' 
        });
      }
      
      console.log('🧪 Testing QR generation:', { phone, amount });
      
      const qrString = PromptPayUtils.generatePromptPayQR(phone, amount);
      const qrCodeDataURL = await PromptPayUtils.generateQRCodeImage(qrString);
      
      res.json({
        success: true,
        phone,
        amount,
        qrString,
        qrCodeDataURL,
        qr_length: qrString.length,
        crc_check: qrString.substring(qrString.length - 4)
      });
    } catch (error) {
      console.error('❌ QR test error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  // Test SMS parsing
  router.post('/test-sms-parse', (req, res) => {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false,
        error: 'No message provided' 
      });
    }
    
    const amountPatterns = [
      { name: 'KBank เงินเข้า', pattern: /เงินเข้า\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/ },
      { name: 'SCB รับเงิน', pattern: /รับเงิน.*?จำนวน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/ },
      { name: 'PromptPay', pattern: /PromptPay.*?จำนวน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/ },
      { name: 'Generic บาท', pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/ },
      { name: 'Numbers only', pattern: /(\d+(?:\.\d{2})?)/ }
    ];
    
    const results = [];
    
    for (const { name, pattern } of amountPatterns) {
      const match = message.match(pattern);
      if (match) {
        results.push({
          pattern_name: name,
          pattern: pattern.toString(),
          matched: match[1],
          amount: parseFloat(match[1].replace(/,/g, ''))
        });
      }
    }
    
    res.json({
      success: true,
      message,
      matches: results,
      best_match: results[0] || null
    });
  });

  // Test SMS detection
  router.post('/test-sms-detection', (req, res) => {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false,
        error: 'No message provided' 
      });
    }
    
    console.log('🧪 Testing SMS detection for:', message);
    
    const transactionType = SMSParser.detectTransactionType(message);
    const amount = SMSParser.parseAmountFromSMS(message);
    const contextClues = SMSParser.analyzeContextClues(message);
    const isKBank = SMSParser.isKBankCurlFormat(message);
    const questionMarkAnalysis = SMSParser.analyzeQuestionMarks(message);
    
    res.json({
      success: true,
      input_message: message,
      detected_type: transactionType,
      parsed_amount: amount,
      context_analysis: contextClues,
      is_kbank_curl_format: isKBank,
      question_mark_analysis: questionMarkAnalysis,
      character_count: message.length,
      contains_thai: /[\u0E00-\u0E7F]/.test(message),
      timestamp: new Date().toISOString()
    });
  });

  // Test KBank detection specifically
  router.post('/test-kbank-detection', (req, res) => {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false,
        error: 'No message provided' 
      });
    }
    
    const isKBank = SMSParser.isKBankCurlFormat(message);
    let kbankType = 'unknown';
    let analysis = null;
    
    if (isKBank) {
      kbankType = SMSParser.detectKBankTransactionType(message);
      analysis = SMSParser.analyzeQuestionMarks(message);
    }
    
    res.json({
      success: true,
      message,
      is_kbank_curl: isKBank,
      detected_type: kbankType,
      question_mark_analysis: analysis,
      examples: {
        incoming_8_marks: "15/09/68 03:49 ?? X-0147 ???????? 100.47 ??????? 435.55 ?.",
        outgoing_7_marks: "15/09/68 03:49 ?? X-0147 ??????? 20.00 ??????? 335.08 ?."
      }
    });
  });

  return router;
};