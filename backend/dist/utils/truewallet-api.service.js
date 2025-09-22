"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrueWalletApiService = void 0;
const common_1 = require("@nestjs/common");
let TrueWalletApiService = class TrueWalletApiService {
    async redeemVoucher(phone, voucherData) {
        const cleanPhone = (phone + "").trim();
        if (!cleanPhone.length || cleanPhone.match(/\D/)) {
            throw new Error("INVALID_PHONE");
        }
        const parts = (voucherData + "").split("v=");
        const voucherMatch = (parts[1] || parts[0]).match(/[0-9A-Za-z]+/);
        if (!voucherMatch) {
            throw new Error("INVALID_VOUCHER_FORMAT");
        }
        const voucher = voucherMatch[0];
        if (voucher.length !== 35) {
            throw new Error("INVALID_VOUCHER");
        }
        try {
            const response = await fetch(`https://gift.truemoney.com/campaign/vouchers/${voucher}/redeem`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                body: JSON.stringify({
                    mobile: cleanPhone,
                    voucher_hash: voucher
                })
            });
            if (!response.ok) {
                const errorCode = `HTTP_ERROR_${response.status}`;
                console.log(`🚫 TrueWallet API Error: ${errorCode}`);
                throw new Error(this.translateError(errorCode));
            }
            const data = await response.json();
            if (data.status && data.status.code === "SUCCESS") {
                return {
                    amount: Number(data.data.my_ticket.amount_baht.replace(/,/g, '')),
                    owner_full_name: data.data.owner_profile.full_name,
                    code: voucher
                };
            }
            const errorCode = data.status?.code || 'UNKNOWN_ERROR';
            throw new Error(this.translateError(errorCode));
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('NETWORK_ERROR');
        }
    }
    translateError(errorCode) {
        const errorMessages = {
            'INVALID_PHONE': 'หมายเลขโทรศัพท์ไม่ถูกต้อง',
            'INVALID_VOUCHER': 'โค้ดซองอั่งเปาไม่ถูกต้อง',
            'INVALID_VOUCHER_FORMAT': 'รูปแบบโค้ดซองอั่งเปาไม่ถูกต้อง',
            'VOUCHER_NOT_FOUND': 'ไม่พบซองอั่งเปานี้',
            'VOUCHER_EXPIRED': 'ซองอั่งเปาหมดอายุแล้ว',
            'VOUCHER_USED': 'ซองอั่งเปานี้ถูกใช้งานแล้ว',
            'RECIPIENT_NOT_FOUND': 'ไม่พบผู้รับในระบบ TrueWallet',
            'NETWORK_ERROR': 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
            'LIMIT_EXCEEDED': 'เกินขีดจำกัดการแลกซองต่อวัน',
            'HTTP_ERROR_400': 'ซองอั่งเปาไม่ถูกต้อง หรือถูกใช้งานแล้ว หรือหมดอายุ',
            'HTTP_ERROR_401': 'ไม่มีสิทธิ์ในการแลกซองนี้',
            'HTTP_ERROR_403': 'การเข้าถึงถูกปฏิเสธ',
            'HTTP_ERROR_404': 'ไม่พบซองอั่งเปานี้ในระบบ',
            'HTTP_ERROR_429': 'มีการร้องขอมากเกินไป กรุณารอสักครู่',
            'HTTP_ERROR_500': 'เซิร์ฟเวอร์ TrueWallet มีปัญหา กรุณาลองใหม่อีกครั้ง'
        };
        return errorMessages[errorCode] || `เกิดข้อผิดพลาด: ${errorCode}`;
    }
    validateVoucherCode(voucherData) {
        try {
            const parts = (voucherData + "").split("v=");
            const voucherMatch = (parts[1] || parts[0]).match(/[0-9A-Za-z]+/);
            if (!voucherMatch) {
                return { isValid: false, cleanCode: '', type: 'code' };
            }
            const voucher = voucherMatch[0];
            const isUrl = voucherData.includes('gift.truemoney.com') || voucherData.includes('v=');
            return {
                isValid: voucher.length === 35,
                cleanCode: voucher,
                type: isUrl ? 'url' : 'code'
            };
        }
        catch {
            return { isValid: false, cleanCode: '', type: 'code' };
        }
    }
};
exports.TrueWalletApiService = TrueWalletApiService;
exports.TrueWalletApiService = TrueWalletApiService = __decorate([
    (0, common_1.Injectable)()
], TrueWalletApiService);
//# sourceMappingURL=truewallet-api.service.js.map