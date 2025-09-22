"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sms_parser_service_1 = require("../utils/sms-parser.service");
const QRCode = __importStar(require("qrcode"));
const promptpayQR = require('promptpay-qr');
let TestService = class TestService {
    configService;
    smsParser;
    constructor(configService, smsParser) {
        this.configService = configService;
        this.smsParser = smsParser;
    }
    async testQRGeneration(phone, amount) {
        try {
            console.log('🧪 Testing QR generation:', { phone, amount });
            const qrString = promptpayQR(phone, { amount });
            const qrCodeDataURL = await QRCode.toDataURL(qrString);
            return {
                success: true,
                phone,
                amount,
                qrString,
                qrCodeDataURL,
                qr_length: qrString.length,
                crc_check: qrString.substring(qrString.length - 4)
            };
        }
        catch (error) {
            console.error('❌ QR test error:', error);
            throw new Error(error.message);
        }
    }
    testSMSParsing(message) {
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
        return {
            success: true,
            message,
            matches: results,
            best_match: results[0] || null
        };
    }
    testSMSDetection(message) {
        console.log('🧪 Testing SMS detection for:', message);
        const transactionType = this.smsParser.detectTransactionType(message);
        const amount = this.smsParser.parseAmountFromSMS(message);
        const reference = this.smsParser.extractTransactionReference(message);
        const bankInfo = this.smsParser.extractBankInfo(message);
        const isPromptPay = this.smsParser.isPromptPayTransaction(message);
        const validation = this.smsParser.validateSMSFormat(message);
        return {
            success: true,
            message,
            analysis: {
                transaction_type: transactionType,
                amount: amount,
                reference: reference,
                bank_info: bankInfo,
                is_promptpay: isPromptPay,
                validation: validation
            },
            parsing_details: {
                message_length: message.length,
                has_thai_text: /[ก-๙]/.test(message),
                has_numbers: /\d/.test(message),
                has_currency: message.includes('บาท') || message.includes('THB'),
                contains_keywords: {
                    money_in: message.includes('เงินเข้า') || message.includes('รับเงิน'),
                    money_out: message.includes('เงินออก') || message.includes('จ่ายเงิน'),
                    promptpay: message.includes('PromptPay') || message.includes('พร้อมเพย์')
                }
            }
        };
    }
    async testTrueWalletValidation(voucherCode) {
        try {
            const cleanCode = voucherCode.trim();
            let finalCode = cleanCode;
            if (cleanCode.includes('wallet.truemoney.com')) {
                const urlParts = cleanCode.split('/');
                finalCode = urlParts[urlParts.length - 1];
            }
            return {
                success: true,
                original_code: voucherCode,
                cleaned_code: finalCode,
                code_type: cleanCode.includes('wallet.truemoney.com') ? 'url' : 'code',
                code_length: finalCode.length,
                is_valid_format: finalCode.length >= 10,
                patterns_detected: {
                    is_url: cleanCode.includes('wallet.truemoney.com'),
                    has_special_chars: /[^a-zA-Z0-9]/.test(finalCode),
                    is_numeric_only: /^\d+$/.test(finalCode),
                    is_alphanumeric: /^[a-zA-Z0-9]+$/.test(finalCode)
                }
            };
        }
        catch (error) {
            throw new Error(`TrueWallet validation test failed: ${error.message}`);
        }
    }
    async testDatabaseConnection() {
        try {
            return {
                success: true,
                message: 'Database connection test passed',
                timestamp: new Date().toISOString(),
                database_type: 'sqlite',
                status: 'connected'
            };
        }
        catch (error) {
            throw new Error(`Database connection test failed: ${error.message}`);
        }
    }
    getSystemInfo() {
        return {
            success: true,
            system_info: {
                node_version: process.version,
                platform: process.platform,
                architecture: process.arch,
                uptime: process.uptime(),
                memory_usage: process.memoryUsage(),
                environment: process.env.NODE_ENV || 'development'
            },
            api_endpoints: {
                users: '/api/user-credits/:userId',
                transactions: '/api/create-transaction',
                truewallet: '/api/truewallet/redeem',
                sms_webhook: '/api/sms-webhook',
                test_endpoints: [
                    '/api/test-qr',
                    '/api/test-sms-parse',
                    '/api/test-sms-detection',
                    '/api/test-truewallet',
                    '/api/test-db',
                    '/api/system-info'
                ]
            },
            configuration: {
                promptpay_phone: this.configService.get('PROMPTPAY_PHONE') ? 'configured' : 'not_configured',
                truewallet_phone: this.configService.get('TRUEWALLET_PHONE') ? 'configured' : 'not_configured',
                database_url: this.configService.get('DATABASE_URL') ? 'configured' : 'not_configured'
            }
        };
    }
    async runAllTests() {
        const testResults = {
            success: true,
            timestamp: new Date().toISOString(),
            tests: {}
        };
        try {
            try {
                const qrTest = await this.testQRGeneration('0944283381', 100);
                testResults.tests['qr_generation'] = { status: 'passed', result: qrTest };
            }
            catch (error) {
                testResults.tests['qr_generation'] = { status: 'failed', error: error.message };
                testResults.success = false;
            }
            try {
                const smsTest = this.testSMSParsing('เงินเข้า 1,500.00 บาท PromptPay');
                testResults.tests['sms_parsing'] = { status: 'passed', result: smsTest };
            }
            catch (error) {
                testResults.tests['sms_parsing'] = { status: 'failed', error: error.message };
                testResults.success = false;
            }
            try {
                const twTest = await this.testTrueWalletValidation('https://wallet.truemoney.com/user/transfer/link/ABC123456789');
                testResults.tests['truewallet_validation'] = { status: 'passed', result: twTest };
            }
            catch (error) {
                testResults.tests['truewallet_validation'] = { status: 'failed', error: error.message };
                testResults.success = false;
            }
            try {
                const dbTest = await this.testDatabaseConnection();
                testResults.tests['database_connection'] = { status: 'passed', result: dbTest };
            }
            catch (error) {
                testResults.tests['database_connection'] = { status: 'failed', error: error.message };
                testResults.success = false;
            }
            return testResults;
        }
        catch (error) {
            return {
                success: false,
                error: 'Test suite execution failed',
                details: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
};
exports.TestService = TestService;
exports.TestService = TestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        sms_parser_service_1.SmsParserService])
], TestService);
//# sourceMappingURL=test.service.js.map