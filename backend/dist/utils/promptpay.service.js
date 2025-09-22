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
var PromptPayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptPayService = void 0;
const common_1 = require("@nestjs/common");
const QRCode = __importStar(require("qrcode"));
let PromptPayService = PromptPayService_1 = class PromptPayService {
    static generateRandomCents() {
        return Math.floor(Math.random() * 99) + 1;
    }
    static generatePromptPayQR(phoneNumber, amount) {
        try {
            let formattedPhone = phoneNumber;
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '66' + formattedPhone.substring(1);
            }
            const amountStr = parseFloat(amount.toString()).toFixed(2);
            console.log('🔧 Generating PromptPay QR:', { phoneNumber, formattedPhone, amount: amountStr });
            let qrData = '';
            qrData += '00' + '02' + '01';
            qrData += '01' + '02' + '11';
            const promptPayData = '0016A000000677010111' +
                '01' + formattedPhone.length.toString().padStart(2, '0') + formattedPhone;
            qrData += '29' + promptPayData.length.toString().padStart(2, '0') + promptPayData;
            qrData += '53' + '03' + '764';
            if (amount > 0) {
                qrData += '54' + amountStr.length.toString().padStart(2, '0') + amountStr;
            }
            qrData += '58' + '02' + 'TH';
            qrData += '6304';
            const crc = PromptPayService_1.calculateCRC16(qrData);
            qrData = qrData.substring(0, qrData.length - 4) + '63' + '04' + crc;
            console.log('✅ Generated QR string:', qrData.substring(0, 50) + '...');
            return qrData;
        }
        catch (error) {
            console.error('❌ Error generating PromptPay QR:', error);
            throw new Error('Failed to generate PromptPay QR');
        }
    }
    static async generateQRCodeImage(qrString) {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(qrString, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            console.log('✅ Generated QR Code image');
            return qrCodeDataURL;
        }
        catch (error) {
            console.error('❌ Error generating QR Code image:', error);
            throw new Error('Failed to generate QR Code image');
        }
    }
    static calculateCRC16(data) {
        const polynomial = 0x1021;
        let crc = 0xFFFF;
        for (let i = 0; i < data.length; i++) {
            crc ^= (data.charCodeAt(i) << 8);
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ polynomial;
                }
                else {
                    crc = crc << 1;
                }
                crc &= 0xFFFF;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }
    static formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '66' + cleaned.substring(1);
        }
        else if (!cleaned.startsWith('66')) {
            cleaned = '66' + cleaned;
        }
        return cleaned;
    }
    static validateAmount(amount) {
        return amount > 0 && amount <= 1000000;
    }
    static generateExpectedAmount(originalAmount) {
        const randomCents = this.generateRandomCents();
        const expectedAmount = originalAmount + (randomCents / 100);
        return {
            expectedAmount: parseFloat(expectedAmount.toFixed(2)),
            randomCents
        };
    }
};
exports.PromptPayService = PromptPayService;
exports.PromptPayService = PromptPayService = PromptPayService_1 = __decorate([
    (0, common_1.Injectable)()
], PromptPayService);
//# sourceMappingURL=promptpay.service.js.map