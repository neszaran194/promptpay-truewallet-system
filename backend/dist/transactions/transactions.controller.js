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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const transactions_service_1 = require("./transactions.service");
let TransactionsController = class TransactionsController {
    transactionsService;
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    async createTransaction(body) {
        try {
            const { userId, amount } = body;
            if (!userId || !amount || amount <= 0) {
                throw new common_1.HttpException({ success: false, error: 'Invalid user ID or amount' }, common_1.HttpStatus.BAD_REQUEST);
            }
            return await this.transactionsService.createTransaction(userId, amount);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('❌ Error creating transaction:', error);
            throw new common_1.HttpException({
                success: false,
                error: 'Internal server error',
                details: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTransactionStatus(transactionId) {
        try {
            return await this.transactionsService.getTransactionStatus(transactionId);
        }
        catch (error) {
            if (error.message === 'Transaction not found') {
                throw new common_1.HttpException({ success: false, error: 'Transaction not found' }, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException({ success: false, error: 'Database error' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTransactionHistory(userId, limit = '10', offset = '0') {
        try {
            return await this.transactionsService.getTransactionHistory(userId, parseInt(limit), parseInt(offset));
        }
        catch (error) {
            console.error('❌ Database error:', error);
            throw new common_1.HttpException({ success: false, error: 'Database error' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteTransaction(transactionId) {
        try {
            return await this.transactionsService.deleteTransaction(transactionId);
        }
        catch (error) {
            if (error.message === 'Transaction not found') {
                throw new common_1.HttpException({ success: false, error: 'Transaction not found' }, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException({ success: false, error: 'Database error' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteAllPendingTransactions() {
        try {
            return await this.transactionsService.deleteAllPendingTransactions();
        }
        catch (error) {
            console.error('❌ Error deleting pending transactions:', error);
            throw new common_1.HttpException({ success: false, error: 'Database error' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async confirmTransaction(transactionId) {
        try {
            return await this.transactionsService.confirmTransaction(transactionId);
        }
        catch (error) {
            if (error.message === 'Transaction not found') {
                throw new common_1.HttpException({ success: false, error: 'Transaction not found' }, common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message === 'Transaction already processed') {
                throw new common_1.HttpException({ success: false, error: 'Transaction already processed' }, common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException({ success: false, error: 'Database error' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getStats() {
        try {
            return await this.transactionsService.getStats();
        }
        catch (error) {
            throw new common_1.HttpException({ success: false, error: 'Database error' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createOutgoingTransaction(body) {
        try {
            const { userId, amount, recipientPhone, description } = body;
            if (!userId || !amount || amount <= 0) {
                throw new common_1.HttpException({ success: false, error: 'Invalid user ID or amount' }, common_1.HttpStatus.BAD_REQUEST);
            }
            return await this.transactionsService.createOutgoingTransaction(userId, amount, recipientPhone, description);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('❌ Error creating outgoing transaction:', error);
            throw new common_1.HttpException({
                success: false,
                error: 'Internal server error',
                details: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getOutgoingTransactions(userId, limit = '10', offset = '0') {
        try {
            return await this.transactionsService.getOutgoingTransactions(userId, parseInt(limit), parseInt(offset));
        }
        catch (error) {
            console.error('❌ Database error:', error);
            throw new common_1.HttpException({ success: false, error: 'Database error' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async processOutgoingPayment(body) {
        try {
            const { transactionId, smsData } = body;
            if (!transactionId) {
                throw new common_1.HttpException({ success: false, error: 'Transaction ID is required' }, common_1.HttpStatus.BAD_REQUEST);
            }
            return await this.transactionsService.processOutgoingPayment(transactionId, smsData);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('❌ Error processing outgoing payment:', error);
            throw new common_1.HttpException({
                success: false,
                error: 'Internal server error',
                details: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)('create-transaction'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('transaction-status/:transactionId'),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTransactionStatus", null);
__decorate([
    (0, common_1.Get)('transactions/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTransactionHistory", null);
__decorate([
    (0, common_1.Delete)('transaction/:transactionId'),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "deleteTransaction", null);
__decorate([
    (0, common_1.Delete)('transactions/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "deleteAllPendingTransactions", null);
__decorate([
    (0, common_1.Post)('confirm-transaction/:transactionId'),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "confirmTransaction", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('create-outgoing-transaction'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "createOutgoingTransaction", null);
__decorate([
    (0, common_1.Get)('outgoing-transactions/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getOutgoingTransactions", null);
__decorate([
    (0, common_1.Post)('process-outgoing-payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "processOutgoingPayment", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map