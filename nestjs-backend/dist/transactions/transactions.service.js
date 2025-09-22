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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const transaction_entity_1 = require("../entities/transaction.entity");
const users_service_1 = require("../users/users.service");
const promptpay_service_1 = require("../utils/promptpay.service");
const uuid_1 = require("uuid");
let TransactionsService = class TransactionsService {
    transactionsRepository;
    usersService;
    configService;
    constructor(transactionsRepository, usersService, configService) {
        this.transactionsRepository = transactionsRepository;
        this.usersService = usersService;
        this.configService = configService;
    }
    async createTransaction(userId, amount) {
        try {
            const transactionId = (0, uuid_1.v4)();
            const phoneNumber = this.configService.get('PROMPTPAY_PHONE');
            if (!phoneNumber) {
                throw new Error('PromptPay phone number not configured');
            }
            const { expectedAmount, randomCents } = promptpay_service_1.PromptPayService.generateExpectedAmount(amount);
            console.log('💳 Creating transaction:', {
                transactionId,
                userId,
                originalAmount: amount,
                expectedAmount,
                randomCents,
                promptpayPhone: phoneNumber
            });
            const qrString = promptpay_service_1.PromptPayService.generatePromptPayQR(phoneNumber, expectedAmount);
            const qrCodeUrl = await promptpay_service_1.PromptPayService.generateQRCodeImage(qrString);
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 5);
            const transaction = this.transactionsRepository.create({
                transaction_id: transactionId,
                user_id: userId,
                amount: expectedAmount,
                status: 'pending',
                qr_code_url: qrCodeUrl,
                expires_at: expiresAt,
                payment_ref: randomCents.toString()
            });
            await this.transactionsRepository.save(transaction);
            const timeRemaining = expiresAt.getTime() - new Date().getTime();
            return {
                success: true,
                transactionId,
                qrCodeUrl,
                amount: expectedAmount,
                originalAmount: amount,
                randomCents,
                expiresAt: expiresAt.toISOString(),
                timeRemaining,
                message: 'Transaction created successfully'
            };
        }
        catch (error) {
            console.error('❌ Error creating transaction:', error);
            throw new Error('Internal server error');
        }
    }
    async getTransactionStatus(transactionId) {
        try {
            const transaction = await this.transactionsRepository.findOne({
                where: { transaction_id: transactionId }
            });
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            const now = new Date();
            const isExpired = now > transaction.expires_at;
            let timeRemaining = 0;
            if (!isExpired && transaction.status === 'pending') {
                timeRemaining = transaction.expires_at.getTime() - now.getTime();
            }
            if (isExpired && transaction.status === 'pending') {
                transaction.status = 'expired';
                await this.transactionsRepository.save(transaction);
            }
            return {
                success: true,
                transaction: {
                    transactionId: transaction.transaction_id,
                    status: transaction.status,
                    amount: Number(transaction.amount),
                    timeRemaining,
                    isExpired: isExpired || transaction.status === 'expired',
                    createdAt: transaction.created_at
                }
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getTransactionHistory(userId, limit = 10, offset = 0) {
        try {
            const [transactions, total] = await this.transactionsRepository.findAndCount({
                where: { user_id: userId },
                order: { created_at: 'DESC' },
                take: Number(limit),
                skip: Number(offset)
            });
            return {
                success: true,
                transactions: transactions.map(tx => ({
                    transaction_id: tx.transaction_id,
                    amount: Number(tx.amount),
                    status: tx.status,
                    type: tx.type || 'incoming',
                    created_at: tx.created_at,
                    expires_at: tx.expires_at
                })),
                total,
                limit: Number(limit),
                offset: Number(offset)
            };
        }
        catch (error) {
            throw new Error('Database error');
        }
    }
    async deleteTransaction(transactionId) {
        try {
            const transaction = await this.transactionsRepository.findOne({
                where: { transaction_id: transactionId }
            });
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            await this.transactionsRepository.remove(transaction);
            return {
                success: true,
                message: 'Transaction deleted successfully'
            };
        }
        catch (error) {
            throw error;
        }
    }
    async deleteAllPendingTransactions() {
        try {
            const result = await this.transactionsRepository.delete({
                status: 'pending'
            });
            return {
                success: true,
                message: `Deleted ${result.affected} pending transactions`
            };
        }
        catch (error) {
            throw new Error('Database error');
        }
    }
    async confirmTransaction(transactionId) {
        try {
            const transaction = await this.transactionsRepository.findOne({
                where: { transaction_id: transactionId }
            });
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            if (transaction.status !== 'pending') {
                throw new Error('Transaction already processed');
            }
            transaction.status = 'confirmed';
            await this.transactionsRepository.save(transaction);
            await this.usersService.updateCredits(transaction.user_id, Number(transaction.amount));
            return {
                success: true,
                message: 'Transaction confirmed successfully',
                transactionId: transaction.transaction_id,
                amount: Number(transaction.amount)
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getStats() {
        try {
            const stats = await this.transactionsRepository
                .createQueryBuilder('transaction')
                .select('transaction.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .addSelect('SUM(transaction.amount)', 'total_amount')
                .groupBy('transaction.status')
                .getRawMany();
            return {
                success: true,
                transaction_stats: stats.map(stat => ({
                    status: stat.status,
                    count: parseInt(stat.count),
                    total_amount: parseFloat(stat.total_amount) || 0
                }))
            };
        }
        catch (error) {
            throw new Error('Database error');
        }
    }
    async findMatchingTransaction(amount) {
        try {
            const transaction = await this.transactionsRepository.findOne({
                where: {
                    amount: amount,
                    status: 'pending'
                },
                order: { created_at: 'DESC' }
            });
            if (transaction) {
                const now = new Date();
                const isExpired = now > transaction.expires_at;
                if (isExpired) {
                    transaction.status = 'expired';
                    await this.transactionsRepository.save(transaction);
                    return null;
                }
                return transaction;
            }
            return null;
        }
        catch (error) {
            console.error('Error finding matching transaction:', error);
            return null;
        }
    }
    async logOutgoingTransaction(from, smsMessage, amount, timestamp) {
        try {
            console.log('📝 Logging outgoing transaction:', { from, amount, timestamp });
            const transactionId = (0, uuid_1.v4)();
            const transaction = this.transactionsRepository.create({
                transaction_id: transactionId,
                user_id: 'system_withdrawal',
                amount: amount,
                status: 'confirmed',
                type: 'outgoing',
                expires_at: new Date(),
                payment_ref: `SMS_${from}_${Date.now()}`,
                created_at: timestamp ? new Date(timestamp) : new Date()
            });
            await this.transactionsRepository.save(transaction);
            console.log('✅ Outgoing transaction logged successfully:', transactionId);
        }
        catch (error) {
            console.error('Error logging outgoing transaction:', error);
        }
    }
    async createOutgoingTransaction(userId, amount, recipientPhone, description) {
        try {
            const transactionId = (0, uuid_1.v4)();
            console.log('💸 Creating outgoing transaction:', {
                transactionId,
                userId,
                amount,
                recipientPhone,
                description
            });
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 30);
            const transaction = this.transactionsRepository.create({
                transaction_id: transactionId,
                user_id: userId,
                amount: amount,
                status: 'pending',
                type: 'outgoing',
                expires_at: expiresAt,
                payment_ref: recipientPhone || 'manual_payment'
            });
            await this.transactionsRepository.save(transaction);
            return {
                success: true,
                transactionId,
                amount,
                type: 'outgoing',
                recipientPhone,
                description,
                expiresAt: expiresAt.toISOString(),
                status: 'pending',
                message: 'Outgoing transaction created successfully',
                instructions: 'Please make the payment and SMS confirmation will be processed automatically'
            };
        }
        catch (error) {
            console.error('❌ Error creating outgoing transaction:', error);
            throw new Error('Internal server error');
        }
    }
    async getOutgoingTransactions(userId, limit = 10, offset = 0) {
        try {
            const [transactions, total] = await this.transactionsRepository.findAndCount({
                where: {
                    user_id: userId,
                    type: 'outgoing'
                },
                order: { created_at: 'DESC' },
                take: Number(limit),
                skip: Number(offset)
            });
            return {
                success: true,
                transactions: transactions.map(tx => ({
                    transaction_id: tx.transaction_id,
                    amount: Number(tx.amount),
                    status: tx.status,
                    type: tx.type,
                    recipient_phone: tx.payment_ref,
                    created_at: tx.created_at,
                    expires_at: tx.expires_at
                })),
                total,
                limit: Number(limit),
                offset: Number(offset)
            };
        }
        catch (error) {
            throw new Error('Database error');
        }
    }
    async processOutgoingPayment(transactionId, smsData) {
        try {
            const transaction = await this.transactionsRepository.findOne({
                where: {
                    transaction_id: transactionId,
                    type: 'outgoing'
                }
            });
            if (!transaction) {
                throw new Error('Outgoing transaction not found');
            }
            if (transaction.status !== 'pending') {
                throw new Error('Transaction already processed');
            }
            const now = new Date();
            if (now > transaction.expires_at) {
                transaction.status = 'expired';
                await this.transactionsRepository.save(transaction);
                throw new Error('Transaction expired');
            }
            transaction.status = 'confirmed';
            await this.transactionsRepository.save(transaction);
            await this.usersService.updateCredits(transaction.user_id, -Number(transaction.amount));
            return {
                success: true,
                message: 'Outgoing payment processed successfully',
                transactionId: transaction.transaction_id,
                amount: Number(transaction.amount),
                type: 'outgoing',
                smsData: smsData || null
            };
        }
        catch (error) {
            throw error;
        }
    }
    async findMatchingOutgoingTransaction(amount) {
        try {
            const transaction = await this.transactionsRepository.findOne({
                where: {
                    amount: amount,
                    status: 'pending',
                    type: 'outgoing'
                },
                order: { created_at: 'DESC' }
            });
            if (transaction) {
                const now = new Date();
                const isExpired = now > transaction.expires_at;
                if (isExpired) {
                    transaction.status = 'expired';
                    await this.transactionsRepository.save(transaction);
                    return null;
                }
                return transaction;
            }
            return null;
        }
        catch (error) {
            console.error('Error finding matching outgoing transaction:', error);
            return null;
        }
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        config_1.ConfigService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map