"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruewalletController = void 0;
const common_1 = require("@nestjs/common");
const truewallet_service_1 = require("./truewallet.service");
let TruewalletController = class TruewalletController {
    truewalletService;
    constructor(truewalletService) {
        this.truewalletService = truewalletService;
    }
    async validateVoucher(body) {
        try {
            const { voucherCode } = body;
            if (!voucherCode) {
                throw new common_1.HttpException({ success: false, error: 'กรุณาระบุโค้ดซองอั่งเปา' }, common_1.HttpStatus.BAD_REQUEST);
            }
            return await this.truewalletService.validateVoucher(voucherCode);
        }
        catch (error) {
            throw new common_1.HttpException({ success: false, error: error.message }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async redeemVoucher(body) {
        try {
            const { userId, voucherCode } = body;
            if (!userId || !voucherCode) {
                throw new common_1.HttpException({ success: false, error: 'กรุณาระบุ User ID และโค้ดซองอั่งเปา' }, common_1.HttpStatus.BAD_REQUEST);
            }
            console.log(`🎁 Processing voucher redemption for user: ${userId}`);
            const result = await this.truewalletService.redeemVoucher(userId, voucherCode);
            return {
                success: true,
                message: 'แลกซองอั่งเปาสำเร็จ',
                ...result,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Voucher redemption error:', error.message);
            throw new common_1.HttpException({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getVoucherHistory(userId, limit = '10', offset = '0') {
        try {
            const history = await this.truewalletService.getVoucherHistory(userId, parseInt(limit), parseInt(offset));
            return {
                success: true,
                history: history,
                total: history.length,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Get voucher history error:', error);
            throw new common_1.HttpException({ success: false, error: 'ไม่สามารถดึงประวัติการแลกซองได้' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getVoucherStats() {
        try {
            const stats = await this.truewalletService.getVoucherStats();
            return {
                success: true,
                stats: stats,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Get voucher stats error:', error);
            throw new common_1.HttpException({ success: false, error: 'ไม่สามารถดึงสถิติการแลกซองได้' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRecentVouchers(limit = '20') {
        try {
            const recent = await this.truewalletService.getRecentVouchers(parseInt(limit));
            return {
                success: true,
                recent_vouchers: recent,
                total: recent.length,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Get recent vouchers error:', error);
            throw new common_1.HttpException({ success: false, error: 'ไม่สามารถดึงซองล่าสุดได้' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteVoucher(voucherId) {
        try {
            return await this.truewalletService.deleteVoucher(parseInt(voucherId));
        }
        catch (error) {
            if (error.message === 'ไม่พบข้อมูลซองอั่งเปา') {
                throw new common_1.HttpException({ success: false, error: 'ไม่พบข้อมูลซองอั่งเปา' }, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException({ success: false, error: 'ไม่สามารถลบข้อมูลซองได้' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllVouchers() {
        try {
            const vouchers = await this.truewalletService.getAllVouchers();
            return {
                success: true,
                vouchers: vouchers,
                total: vouchers.length,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({ success: false, error: 'ไม่สามารถดึงข้อมูลซองทั้งหมดได้' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.TruewalletController = TruewalletController;
__decorate([
    (0, common_1.Post)('validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TruewalletController.prototype, "validateVoucher", null);
__decorate([
    (0, common_1.Post)('redeem'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TruewalletController.prototype, "redeemVoucher", null);
__decorate([
    (0, common_1.Get)('history/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TruewalletController.prototype, "getVoucherHistory", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TruewalletController.prototype, "getVoucherStats", null);
__decorate([
    (0, common_1.Get)('recent'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TruewalletController.prototype, "getRecentVouchers", null);
__decorate([
    (0, common_1.Delete)('voucher/:voucherId'),
    __param(0, (0, common_1.Param)('voucherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TruewalletController.prototype, "deleteVoucher", null);
__decorate([
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TruewalletController.prototype, "getAllVouchers", null);
exports.TruewalletController = TruewalletController = __decorate([
    (0, common_1.Controller)('api/truewallet'),
    __metadata("design:paramtypes", [truewallet_service_1.TruewalletService])
], TruewalletController);
//# sourceMappingURL=truewallet.controller.js.map