"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsParserService = void 0;
const common_1 = require("@nestjs/common");
let SmsParserService = class SmsParserService {
    detectTransactionType(smsMessage) {
        const message = smsMessage.toLowerCase();
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
            'deposit'
        ];
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
        for (const pattern of incomingPatterns) {
            if (message.includes(pattern)) {
                return 'incoming';
            }
        }
        for (const pattern of outgoingPatterns) {
            if (message.includes(pattern)) {
                return 'outgoing';
            }
        }
        return 'unknown';
    }
    parseAmountFromSMS(smsMessage) {
        const patterns = [
            /(?:Deposit|Withdrawal)\s+([\d,]+\.?\d*)/i,
            /([\d,]+\.?\d*)\s*บาท(?!\s*Outstanding)/gi,
            /THB\s*([\d,]+\.?\d*)/g,
            /([\d,]+\.?\d*)\s*THB/g,
            /฿([\d,]+\.?\d*)/g,
            /([\d,]+\.?\d*)\s*Baht(?!\s*\.)/gi
        ];
        for (const pattern of patterns) {
            const match = smsMessage.match(pattern);
            if (match && match[1]) {
                const cleanAmount = match[1]
                    .replace(/[^\d.]/g, '')
                    .replace(/,/g, '');
                const amount = parseFloat(cleanAmount);
                if (!isNaN(amount) && amount > 0 && amount < 1000000 && amount !== 22 && amount !== 25) {
                    return amount;
                }
            }
        }
        return null;
    }
    extractTransactionReference(smsMessage) {
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
    extractBankInfo(smsMessage) {
        const message = smsMessage.toLowerCase();
        const result = {};
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
            if (result.bank)
                break;
        }
        const accountMatch = smsMessage.match(/\d{3}-\d{1}-\d{5}-\d{1}|\d{10,}/);
        if (accountMatch) {
            result.account = accountMatch[0];
        }
        return result;
    }
    isPromptPayTransaction(smsMessage) {
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
    validateSMSFormat(smsMessage) {
        if (!smsMessage || smsMessage.trim().length === 0) {
            return { isValid: false, reason: 'Empty message' };
        }
        if (smsMessage.length < 10) {
            return { isValid: false, reason: 'Message too short' };
        }
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
};
exports.SmsParserService = SmsParserService;
exports.SmsParserService = SmsParserService = __decorate([
    (0, common_1.Injectable)()
], SmsParserService);
//# sourceMappingURL=sms-parser.service.js.map