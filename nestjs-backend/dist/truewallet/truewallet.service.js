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
const truewallet_api_service_1 = require("../utils/truewallet-api.service");
const transactions_service_1 = require("../transactions/transactions.service");
let TruewalletService = class TruewalletService {
    vouchersRepository;
    usersService;
    trueWalletApiService;
    transactionsService;
    constructor(vouchersRepository, usersService, trueWalletApiService, transactionsService) {
        this.vouchersRepository = vouchersRepository;
        this.usersService = usersService;
        this.trueWalletApiService = trueWalletApiService;
        this.transactionsService = transactionsService;
    }
    async validateVoucher(voucherCode) {
        try {
            const validation = this.trueWalletApiService.validateVoucherCode(voucherCode.trim());
            if (!validation.isValid) {
                throw new Error('โค้ดซองอั่งเปาไม่ถูกต้อง');
            }
            return {
                success: true,
                validation: {
                    type: validation.type,
                    code: validation.cleanCode
                }
            };
        }
        catch (error) {
            throw new Error('โค้ดซองอั่งเปาไม่ถูกต้อง');
        }
    }
    async redeemVoucher(userId, voucherCode, phone) {
        try {
            console.log(`🎁 Starting voucher redemption for user: ${userId}, code: ${voucherCode}`);
            const validation = await this.validateVoucher(voucherCode);
            const cleanCode = validation.validation.code;
            console.log(`✅ Voucher validated, clean code: ${cleanCode}`);
            const existingVoucher = await this.vouchersRepository.findOne({
                where: { voucher_code: cleanCode }
            });
            if (existingVoucher) {
                console.log(`❌ Voucher already redeemed in our system: ${cleanCode}`);
                throw new Error('ซองอั่งเปานี้ถูกใช้งานในระบบแล้ว');
            }
            const phoneNumber = phone || process.env.TRUEWALLET_PHONE || '0944283381';
            if (cleanCode.includes('TEST')) {
                console.log('🔄 Using fallback mode for test voucher');
                const mockResult = {
                    amount: Math.floor(Math.random() * 500) + 50,
                    owner_full_name: 'Test TrueWallet User',
                    code: cleanCode
                };
                await this.usersService.findOrCreateUser(userId);
                console.log(`👤 User ensured: ${userId}`);
                const voucherRecord = this.vouchersRepository.create({
                    user_id: userId,
                    voucher_code: cleanCode,
                    amount: mockResult.amount,
                    owner_full_name: mockResult.owner_full_name,
                    status: 'redeemed'
                });
                const savedVoucher = await this.vouchersRepository.save(voucherRecord);
                console.log(`💾 Test voucher saved:`, savedVoucher);
                const updatedUser = await this.usersService.updateCredits(userId, mockResult.amount);
                console.log(`💳 Credits updated for user ${userId}, new balance: ${updatedUser.credits}`);
                await this.transactionsService.createTrueWalletTransaction(userId, mockResult.amount, cleanCode, mockResult.owner_full_name);
                console.log(`📝 Transaction record created for TrueWallet voucher`);
                return {
                    voucher_info: {
                        amount: mockResult.amount,
                        owner_full_name: mockResult.owner_full_name,
                        voucher_code: cleanCode
                    }
                };
            }
            try {
                console.log(`📞 Calling TrueWallet API with phone: ${phoneNumber}`);
                const apiResult = await this.trueWalletApiService.redeemVoucher(phoneNumber, voucherCode);
                console.log(`💰 TrueWallet API result:`, apiResult);
                await this.usersService.findOrCreateUser(userId);
                console.log(`👤 User ensured: ${userId}`);
                const voucherRecord = this.vouchersRepository.create({
                    user_id: userId,
                    voucher_code: cleanCode,
                    amount: apiResult.amount,
                    owner_full_name: apiResult.owner_full_name,
                    status: 'redeemed'
                });
                const savedVoucher = await this.vouchersRepository.save(voucherRecord);
                console.log(`💾 Voucher saved:`, savedVoucher);
                const updatedUser = await this.usersService.updateCredits(userId, apiResult.amount);
                console.log(`💳 Credits updated for user ${userId}, new balance: ${updatedUser.credits}`);
                await this.transactionsService.createTrueWalletTransaction(userId, apiResult.amount, cleanCode, apiResult.owner_full_name);
                console.log(`📝 Transaction record created for TrueWallet voucher`);
                return {
                    voucher_info: {
                        amount: apiResult.amount,
                        owner_full_name: apiResult.owner_full_name,
                        voucher_code: cleanCode
                    }
                };
            }
            catch (apiError) {
                console.error('❌ TrueWallet API error:', apiError);
                if (apiError instanceof Error) {
                    throw apiError;
                }
                throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ TrueWallet');
            }
        }
        catch (error) {
            console.error('❌ TrueWallet redeem error:', error);
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
        users_service_1.UsersService,
        truewallet_api_service_1.TrueWalletApiService,
        transactions_service_1.TransactionsService])
], TruewalletService);
//# sourceMappingURL=truewallet.service.js.map