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
exports.TruewalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const truewallet_voucher_entity_1 = require("../entities/truewallet-voucher.entity");
const users_service_1 = require("../users/users.service");
let TruewalletService = class TruewalletService {
    vouchersRepository;
    usersService;
    constructor(vouchersRepository, usersService) {
        this.vouchersRepository = vouchersRepository;
        this.usersService = usersService;
    }
    async validateVoucher(voucherCode) {
        try {
            const cleanCode = voucherCode.trim();
            let finalCode = cleanCode;
            if (cleanCode.includes('wallet.truemoney.com')) {
                const urlParts = cleanCode.split('/');
                finalCode = urlParts[urlParts.length - 1];
            }
            if (finalCode.length < 10) {
                throw new Error('โค้ดซองอั่งเปาไม่ถูกต้อง');
            }
            return {
                success: true,
                validation: {
                    type: cleanCode.includes('wallet.truemoney.com') ? 'url' : 'code',
                    code: finalCode
                }
            };
        }
        catch (error) {
            throw new Error('โค้ดซองอั่งเปาไม่ถูกต้อง');
        }
    }
    async redeemVoucher(userId, voucherCode) {
        try {
            const validation = await this.validateVoucher(voucherCode);
            const cleanCode = validation.validation.code;
            const existingVoucher = await this.vouchersRepository.findOne({
                where: { voucher_code: cleanCode }
            });
            if (existingVoucher) {
                throw new Error('ซองอั่งเปานี้ถูกใช้งานแล้ว');
            }
            const result = {
                success: true,
                voucher_info: {
                    amount: 100,
                    owner_full_name: 'Test User',
                    message: 'Test voucher redemption'
                }
            };
            if (!result.success) {
                throw new Error('ไม่สามารถแลกซองอั่งเปาได้');
            }
            const { voucher_info } = result;
            const voucherRecord = this.vouchersRepository.create({
                user_id: userId,
                voucher_code: cleanCode,
                amount: voucher_info.amount,
                owner_full_name: voucher_info.owner_full_name,
                status: 'redeemed'
            });
            await this.vouchersRepository.save(voucherRecord);
            await this.usersService.updateCredits(userId, voucher_info.amount);
            return {
                voucher_info: {
                    amount: voucher_info.amount,
                    owner_full_name: voucher_info.owner_full_name,
                    voucher_code: cleanCode
                }
            };
        }
        catch (error) {
            console.error('TrueWallet redeem error:', error);
            throw new Error(error.message || 'เกิดข้อผิดพลาดในการแลกซอง');
        }
    }
    async getVoucherHistory(userId, limit = 10, offset = 0) {
        try {
            const vouchers = await this.vouchersRepository.find({
                where: { user_id: userId },
                order: { redeemed_at: 'DESC' },
                take: Number(limit),
                skip: Number(offset)
            });
            return vouchers.map(voucher => ({
                voucher_code: voucher.voucher_code,
                amount: Number(voucher.amount),
                owner_full_name: voucher.owner_full_name,
                redeemed_at: voucher.redeemed_at,
                status: voucher.status
            }));
        }
        catch (error) {
            throw new Error('ไม่สามารถดึงประวัติการแลกซองได้');
        }
    }
    async getVoucherStats() {
        try {
            const stats = await this.vouchersRepository
                .createQueryBuilder('voucher')
                .select('COUNT(*)', 'total_redeemed')
                .addSelect('SUM(voucher.amount)', 'total_amount')
                .addSelect('AVG(voucher.amount)', 'average_amount')
                .getRawOne();
            return {
                total_redeemed: parseInt(stats.total_redeemed) || 0,
                total_amount: parseFloat(stats.total_amount) || 0,
                average_amount: parseFloat(stats.average_amount) || 0
            };
        }
        catch (error) {
            throw new Error('ไม่สามารถดึงสถิติการแลกซองได้');
        }
    }
    async getRecentVouchers(limit = 20) {
        try {
            const recent = await this.vouchersRepository.find({
                order: { redeemed_at: 'DESC' },
                take: Number(limit)
            });
            return recent.map(voucher => ({
                id: voucher.id,
                user_id: voucher.user_id,
                voucher_code: voucher.voucher_code,
                amount: Number(voucher.amount),
                owner_full_name: voucher.owner_full_name,
                redeemed_at: voucher.redeemed_at,
                status: voucher.status
            }));
        }
        catch (error) {
            throw new Error('ไม่สามารถดึงข้อมูลซองล่าสุดได้');
        }
    }
    async deleteVoucher(voucherId) {
        try {
            const voucher = await this.vouchersRepository.findOne({
                where: { id: voucherId }
            });
            if (!voucher) {
                throw new Error('ไม่พบข้อมูลซองอั่งเปา');
            }
            await this.vouchersRepository.remove(voucher);
            return {
                success: true,
                message: 'ลบข้อมูลซองอั่งเปาสำเร็จ'
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getAllVouchers() {
        try {
            const vouchers = await this.vouchersRepository.find({
                order: { redeemed_at: 'DESC' }
            });
            return vouchers.map(voucher => ({
                id: voucher.id,
                user_id: voucher.user_id,
                voucher_code: voucher.voucher_code,
                amount: Number(voucher.amount),
                owner_full_name: voucher.owner_full_name,
                redeemed_at: voucher.redeemed_at,
                status: voucher.status
            }));
        }
        catch (error) {
            throw new Error('ไม่สามารถดึงข้อมูลซองทั้งหมดได้');
        }
    }
};
exports.TruewalletService = TruewalletService;
exports.TruewalletService = TruewalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(truewallet_voucher_entity_1.TrueWalletVoucher)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], TruewalletService);
//# sourceMappingURL=truewallet.service.js.map