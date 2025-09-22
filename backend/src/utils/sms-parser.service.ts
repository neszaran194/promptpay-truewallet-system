import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsParserService {

  detectTransactionType(smsMessage: string): 'incoming' | 'outgoing' | 'unknown' {
    const message = smsMessage.toLowerCase();

    // Pattern สำหรับเงินเข้า
    const incomingPatterns = [
      'ได้รับเงิน',
      'เงินเข้า',
      'รับโอน',
      'ยอดเงินรับ',
      'received',
      'credit',
      'เครดิต',
      'money in',
      'รับเงิน',
      'deposit'  // KBank pattern
    ];

    // Pattern สำหรับเงินออก
    const outgoingPatterns = [
      'จ่ายเงิน',
      'เงินออก',
      'โอนเงิน',
      'ซื้อ',
      'จ่าย',
      'withdraw',
      'debit',
      'เดบิต'
    ];

    // ตรวจสอบเงินเข้า
    for (const pattern of incomingPatterns) {
      if (message.includes(pattern)) {
        return 'incoming';
      }
    }

    // ตรวจสอบเงินออก
    for (const pattern of outgoingPatterns) {
      if (message.includes(pattern)) {
        return 'outgoing';
      }
    }

    return 'unknown';
  }

  parseAmountFromSMS(smsMessage: string): number | null {
    // Pattern สำหรับการหาจำนวนเงิน - เพิ่ม KBank format (เรียงตาม priority)
    const patterns = [
      // KBank format: "Deposit 1.33" หรือ "Withdrawal 5.00" (ความสำคัญสูงสุด)
      /(?:Deposit|Withdrawal)\s+([\d,]+\.?\d*)/i,
      // รูปแบบ "1,234.56 บาท" (ก่อน Outstanding Balance)
      /([\d,]+\.?\d*)\s*บาท(?!\s*Outstanding)/gi,
      // รูปแบบ "THB 1,234.56"
      /THB\s*([\d,]+\.?\d*)/g,
      // รูปแบบ "1,234.56 THB"
      /([\d,]+\.?\d*)\s*THB/g,
      // รูปแบบ "฿1,234.56"
      /฿([\d,]+\.?\d*)/g,
      // รูปแบบ "1,234.56 Baht" (แต่ไม่ใช่ Outstanding Balance)
      /([\d,]+\.?\d*)\s*Baht(?!\s*\.)/gi
    ];

    for (const pattern of patterns) {
      const match = smsMessage.match(pattern);
      if (match && match[1]) {
        // ทำความสะอาดตัวเลข
        const cleanAmount = match[1]
          .replace(/[^\d.]/g, '') // เอาเฉพาะตัวเลขและจุด
          .replace(/,/g, ''); // เอาคอมม่าออก

        const amount = parseFloat(cleanAmount);

        // ตรวจสอบว่าเป็นจำนวนเงินที่สมเหตุสมผล (ไม่ใช่วันที่หรือเลขบัญชี)
        if (!isNaN(amount) && amount > 0 && amount < 1000000 && amount !== 22 && amount !== 25) {
          return amount;
        }
      }
    }

    return null;
  }

  extractTransactionReference(smsMessage: string): string | null {
    // Pattern สำหรับการหา reference number
    const patterns = [
      /ref[:\s]*([a-zA-Z0-9]+)/i,
      /อ้างอิง[:\s]*([a-zA-Z0-9]+)/i,
      /เลขที่[:\s]*([a-zA-Z0-9]+)/i,
      /transaction[:\s]*([a-zA-Z0-9]+)/i
    ];

    for (const pattern of patterns) {
      const match = smsMessage.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  extractBankInfo(smsMessage: string): { bank?: string; account?: string } {
    const message = smsMessage.toLowerCase();
    const result: { bank?: string; account?: string } = {};

    // ตรวจสอบธนาคาร
    const bankPatterns = {
      'scb': ['ไทยพาณิชย์', 'scb'],
      'kbank': ['กสิกรไทย', 'kbank', 'k-bank'],
      'bbl': ['กรุงเทพ', 'bbl', 'bangkok bank'],
      'tmb': ['ทหารไทย', 'tmb'],
      'ktb': ['กรุงไทย', 'ktb', 'krung thai'],
      'bay': ['กรุงศรีอยุธยา', 'bay', 'krungsri']
    };

    for (const [bankCode, patterns] of Object.entries(bankPatterns)) {
      for (const pattern of patterns) {
        if (message.includes(pattern)) {
          result.bank = bankCode.toUpperCase();
          break;
        }
      }
      if (result.bank) break;
    }

    // ตรวจสอบเลขบัญชี
    const accountMatch = smsMessage.match(/\d{3}-\d{1}-\d{5}-\d{1}|\d{10,}/);
    if (accountMatch) {
      result.account = accountMatch[0];
    }

    return result;
  }

  isPromptPayTransaction(smsMessage: string): boolean {
    const message = smsMessage.toLowerCase();
    const promptPayKeywords = [
      'promptpay',
      'พร้อมเพย์',
      'qr code',
      'qr payment',
      'สแกน qr'
    ];

    return promptPayKeywords.some(keyword => message.includes(keyword));
  }

  validateSMSFormat(smsMessage: string): { isValid: boolean; reason?: string } {
    if (!smsMessage || smsMessage.trim().length === 0) {
      return { isValid: false, reason: 'Empty message' };
    }

    if (smsMessage.length < 10) {
      return { isValid: false, reason: 'Message too short' };
    }

    // ตรวจสอบว่ามีข้อมูลพื้นฐาน
    const hasAmount = this.parseAmountFromSMS(smsMessage) !== null;
    const hasTransactionType = this.detectTransactionType(smsMessage) !== 'unknown';

    if (!hasAmount) {
      return { isValid: false, reason: 'No amount found' };
    }

    if (!hasTransactionType) {
      return { isValid: false, reason: 'Cannot determine transaction type' };
    }

    return { isValid: true };
  }
}