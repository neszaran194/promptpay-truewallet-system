// utils/smsParser.js

class SMSParser {
  // ตรวจสอบว่าเป็น KBank curl format หรือไม่
  static isKBankCurlFormat(smsMessage) {
    const kbankCurlPattern = /\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}\s+\?\?\s+X-\d{4}\s+\?+\s+\d+\.\d{2}\s+\?+\s+\d+\.\d{2}\s+\?\./;
    return kbankCurlPattern.test(smsMessage);
  }

  // ตรวจจับประเภท transaction ของ KBank ตามจำนวน ?
  static detectKBankTransactionType(smsMessage) {
    console.log('🏦 Analyzing KBank curl format...');
    
    const kbankPattern = /(\d{2}\/\d{2}\/\d{2})\s+(\d{2}:\d{2})\s+(\?\?)\s+(X-\d{4})\s+(\?+)\s+(\d+\.\d{2})\s+(\?+)\s+(\d+\.\d{2})\s+(\?\.)/;
    const match = smsMessage.match(kbankPattern);
    
    if (!match) {
      console.log('❌ KBank pattern not matched');
      return 'unknown';
    }
    
    const [, date, time, account_prefix, account, action_field, amount, balance_prefix, balance, suffix] = match;
    
    console.log('📋 KBank SMS breakdown:', {
      date,
      time,
      account_prefix: account_prefix + ' ' + account,
      action_field: `"${action_field}" (${action_field.length} chars)`,
      amount,
      balance_prefix: `"${balance_prefix}" (${balance_prefix.length} chars)`,
      balance,
      suffix
    });
    
    const actionQuestionMarks = action_field.length;
    
    if (actionQuestionMarks === 8) {
      console.log('✅ KBank: 8 question marks detected -> INCOMING transaction');
      return 'incoming';
    } else if (actionQuestionMarks === 7) {
      console.log('✅ KBank: 7 question marks detected -> OUTGOING transaction');
      return 'outgoing';
    } else {
      console.log(`❓ KBank: Unexpected question mark count: ${actionQuestionMarks}`);
      return 'unknown';
    }
  }

  // ฟังก์ชันตรวจสอบประเภทของ transaction
  static detectTransactionType(smsMessage) {
    console.log('🔍 Detecting transaction type for:', smsMessage);
    
    // ตรวจสอบ KBank pattern เป็นพิเศษ (สำหรับ curl format)
    if (this.isKBankCurlFormat(smsMessage)) {
      const kbankType = this.detectKBankTransactionType(smsMessage);
      if (kbankType !== 'unknown') {
        console.log('✅ KBank transaction type detected:', kbankType);
        return kbankType;
      }
    }
    
    // Patterns สำหรับเงินเข้า (ภาษาไทยปกติ)
    const incomingPatterns = [
      /เงินเข้า/,
      /รับเงิน/,
      /เข้าบัญชี/,
      /PromptPay.*รับ/,
      /โอนเข้า/,
      /ฝากเงิน/,
    ];
    
    // Patterns สำหรับเงินออก (ภาษาไทยปกติ)
    const outgoingPatterns = [
      /เงินออก/,
      /จ่ายเงิน/,
      /ถอนเงิน/,
      /โอนออก/,
      /ซื้อ/,
      /จ่าย/,
      /ชำระ/,
      /Payment/i,
      /Purchase/i,
      /Withdrawal/i,
    ];
    
    // ตรวจสอบเงินเข้าก่อน
    for (const pattern of incomingPatterns) {
      if (pattern.test(smsMessage)) {
        console.log('✅ Incoming transaction detected by pattern:', pattern.toString());
        return 'incoming';
      }
    }
    
    // ตรวจสอบเงินออก
    for (const pattern of outgoingPatterns) {
      if (pattern.test(smsMessage)) {
        console.log('✅ Outgoing transaction detected by pattern:', pattern.toString());
        return 'outgoing';
      }
    }
    
    console.log('❓ Unknown transaction type');
    return 'unknown';
  }

  // ฟังก์ชันแยกจำนวนเงินจาก SMS
  static parseAmountFromSMS(smsMessage) {
    console.log('💰 Parsing amount from SMS:', smsMessage);
    
    const amountPatterns = [
      // ภาษาไทยปกติ
      { 
        name: 'KBank เงินเข้า',
        pattern: /เงินเข้า\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
        priority: 1
      },
      { 
        name: 'KBank เงินออก',
        pattern: /เงินออก\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
        priority: 1
      },
      
      // Patterns สำหรับ curl (? characters)
      { 
        name: 'KBank format (curl)',
        pattern: /X-\d{4}\s+\?+\s+(\d+\.\d{2})\s+\?+\s+\d+\.\d{2}/,
        priority: 2
      },
      { 
        name: 'Amount before balance',
        pattern: /(\d+\.\d{2})\s+\?+\s+\d+\.\d{2}\s*\?*\.*/,
        priority: 3
      },
      
      // SCB patterns  
      { 
        name: 'SCB รับเงิน',
        pattern: /รับเงิน.*?จำนวน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
        priority: 1
      },
      { 
        name: 'SCB จ่ายเงิน',
        pattern: /จ่ายเงิน.*?จำนวน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
        priority: 1
      },
      
      // PromptPay patterns
      { 
        name: 'PromptPay',
        pattern: /PromptPay.*?จำนวน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
        priority: 1
      },
      
      // Generic patterns
      { 
        name: 'Generic บาท',
        pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*บาท/,
        priority: 4
      },
      { 
        name: 'จำนวน',
        pattern: /จำนวน\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
        priority: 4
      },
      { 
        name: 'First decimal number',
        pattern: /(\d+\.\d{2})/,
        priority: 5
      }
    ];
    
    // เรียงลำดับตาม priority
    amountPatterns.sort((a, b) => a.priority - b.priority);
    
    for (const { name, pattern, priority } of amountPatterns) {
      const match = smsMessage.match(pattern);
      if (match) {
        const amount = parseFloat(parseFloat(match[1].replace(/,/g, '')).toFixed(2));
        console.log(`✅ Amount found: ${amount} from ${name} (priority: ${priority})`);
        return amount;
      }
    }
    
    console.log('❌ No amount found in SMS');
    return null;
  }

  // วิเคราะห์เครื่องหมาย ?
  static analyzeQuestionMarks(smsMessage) {
    if (!smsMessage.includes('?')) {
      return { has_question_marks: false };
    }
    
    const questionMarkGroups = smsMessage.match(/\?+/g) || [];
    
    const analysis = {
      has_question_marks: true,
      total_question_marks: (smsMessage.match(/\?/g) || []).length,
      question_mark_groups: questionMarkGroups.map((group, index) => ({
        group_number: index + 1,
        text: group,
        length: group.length,
        position: smsMessage.indexOf(group)
      })),
      is_kbank_pattern: false
    };
    
    if (questionMarkGroups.length >= 3) {
      const [first, second, third] = questionMarkGroups;
      
      if (first === '??' && (second.length === 7 || second.length === 8)) {
        analysis.is_kbank_pattern = true;
        analysis.kbank_interpretation = {
          account_prefix: first,
          action_field: second,
          balance_prefix: third,
          predicted_type: second.length === 8 ? 'incoming' : 'outgoing'
        };
      }
    }
    
    return analysis;
  }

  // วิเคราะห์ context clues
  static analyzeContextClues(smsMessage) {
    const analysis = {
      type: 'unknown',
      confidence: 0,
      clues: [],
      kbank_analysis: null
    };
    
    if (this.isKBankCurlFormat(smsMessage)) {
      const kbankType = this.detectKBankTransactionType(smsMessage);
      
      analysis.kbank_analysis = {
        is_kbank_curl: true,
        detected_type: kbankType,
        method: 'question_mark_counting'
      };
      
      if (kbankType !== 'unknown') {
        analysis.type = kbankType;
        analysis.confidence = 0.9;
        analysis.clues.push(`KBank curl format: ${kbankType} detected by question mark pattern`);
      }
      
      return analysis;
    }
    
    // การวิเคราะห์แบบเดิมสำหรับ format อื่นๆ
    const kbankThaiPattern = /(\d{2}\/\d{2}\/\d{2})\s+(\d{2}:\d{2})\s+(บช)\s+(X-\d{4})\s+(.+?)\s+(\d+\.\d{2})\s+(.+?)\s+(\d+\.\d{2})/;
    const match = smsMessage.match(kbankThaiPattern);
    
    if (match) {
      const [, date, time, account_type, account, action, amount, status_text, balance] = match;
      
      analysis.clues.push('KBank Thai format detected');
      analysis.clues.push(`Action: "${action}"`);
      
      if (action.includes('เข้า')) {
        analysis.type = 'incoming';
        analysis.confidence = 0.95;
        analysis.clues.push('Action contains "เข้า" -> incoming');
      } else if (action.includes('ออก')) {
        analysis.type = 'outgoing'; 
        analysis.confidence = 0.95;
        analysis.clues.push('Action contains "ออก" -> outgoing');
      }
    }
    
    return analysis;
  }
}

module.exports = SMSParser;