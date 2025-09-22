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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const sms_parser_service_1 = require("../utils/sms-parser.service");
const transactions_service_1 = require("../transactions/transactions.service");
const users_service_1 = require("../users/users.service");
let SmsService = class SmsService {
    smsParser;
    transactionsService;
    usersService;
    constructor(smsParser, transactionsService, usersService) {
        this.smsParser = smsParser;
        this.transactionsService = transactionsService;
        this.usersService = usersService;
    }
    async processSMSWebhook(smsData) {
        console.log('📱 SMS webhook received');
        try {
            const { from, message, text, timestamp } = smsData;
            console.log('SMS data:', smsData);
            const smsMessage = message || text;
            if (!smsMessage) {
                console.log('❌ No message or text field provided');
                throw new Error('No message provided');
            }
            console.log('🔍 Processing SMS message:', smsMessage);
            console.log('📤 Message length:', smsMessage.length, 'chars');
            const validation = this.smsParser.validateSMSFormat(smsMessage);
            if (!validation.isValid) {
                throw new Error(`Invalid SMS format: ${validation.reason}`);
            }
            const transactionType = this.smsParser.detectTransactionType(smsMessage);
            console.log('💳 Transaction type detected:', transactionType);
            if (transactionType === 'outgoing') {
                return await this.handleOutgoingTransaction(from, smsMessage, timestamp);
            }
            if (transactionType !== 'incoming') {
                console.log('ℹ️ SMS is not incoming transaction:', transactionType);
                return {
                    success: true,
                    message: 'SMS processed but not incoming transaction',
                    type: transactionType,
                    bank: from
                };
            }
            return await this.handleIncomingTransaction(from, smsMessage, timestamp);
        }
        catch (error) {
            console.error('❌ SMS processing error:', error);
            throw error;
        }
    }
    async handleOutgoingTransaction(from, smsMessage, timestamp) {
        console.log('💸 Outgoing transaction detected - checking for matching pending transactions');
        const outgoingAmount = this.smsParser.parseAmountFromSMS(smsMessage);
        if (!outgoingAmount) {
            return {
                success: true,
                message: 'Outgoing transaction detected but amount not parsed',
                type: 'outgoing',
                bank: from,
                processed: false,
                raw_message: smsMessage
            };
        }
        console.log('💰 Outgoing amount detected:', outgoingAmount, 'THB');
        const matchingOutgoingTransaction = await this.transactionsService.findMatchingOutgoingTransaction(outgoingAmount);
        if (!matchingOutgoingTransaction) {
            console.log('ℹ️ No matching outgoing transaction found for amount:', outgoingAmount);
            await this.transactionsService.logOutgoingTransaction(from, smsMessage, outgoingAmount, timestamp);
            return {
                success: true,
                message: 'Outgoing transaction logged (no matching pending transaction)',
                type: 'outgoing',
                amount: outgoingAmount,
                bank: from,
                processed: false,
                note: 'No pending outgoing transaction found to match this SMS'
            };
        }
        console.log('✅ Found matching outgoing transaction:', matchingOutgoingTransaction.transaction_id);
        try {
            const processResult = await this.transactionsService.processOutgoingPayment(matchingOutgoingTransaction.transaction_id, { from, smsMessage, timestamp });
            console.log('🎉 Outgoing payment processed successfully!');
            const reference = this.smsParser.extractTransactionReference(smsMessage);
            const bankInfo = this.smsParser.extractBankInfo(smsMessage);
            return {
                success: true,
                message: 'Outgoing payment confirmed successfully',
                transaction_id: matchingOutgoingTransaction.transaction_id,
                amount: outgoingAmount,
                user_id: matchingOutgoingTransaction.user_id,
                bank: from,
                reference: reference,
                bank_info: bankInfo,
                type: 'outgoing',
                confirmed_at: new Date().toISOString(),
                sms_timestamp: timestamp,
                processed: true
            };
        }
        catch (error) {
            console.error('❌ Error processing outgoing payment:', error);
            return {
                success: false,
                error: 'Error processing outgoing payment',
                transaction_id: matchingOutgoingTransaction.transaction_id,
                amount: outgoingAmount,
                bank: from,
                details: error.message
            };
        }
    }
    async handleIncomingTransaction(from, smsMessage, timestamp) {
        const receivedAmount = this.smsParser.parseAmountFromSMS(smsMessage);
        if (!receivedAmount) {
            console.log('❌ Amount not found in SMS:', smsMessage);
            throw new Error('Amount not found in SMS');
        }
        console.log('💰 Amount detected:', receivedAmount, 'THB');
        const matchingTransaction = await this.findMatchingTransaction(receivedAmount);
        if (!matchingTransaction) {
            console.log('❌ No matching transaction found for amount:', receivedAmount);
            return {
                success: false,
                error: 'No matching transaction found',
                amount: receivedAmount,
                bank: from,
                suggestions: 'อาจจะมีการโอนเงินที่ไม่ได้ระบุใน transaction หรือ transaction หมดอายุแล้ว'
            };
        }
        console.log('✅ Found matching transaction:', matchingTransaction.transaction_id);
        try {
            const confirmResult = await this.transactionsService.confirmTransaction(matchingTransaction.transaction_id);
            console.log('🎉 Transaction confirmed successfully!');
            const reference = this.smsParser.extractTransactionReference(smsMessage);
            const bankInfo = this.smsParser.extractBankInfo(smsMessage);
            const isPromptPay = this.smsParser.isPromptPayTransaction(smsMessage);
            return {
                success: true,
                message: 'Payment confirmed successfully',
                transaction_id: matchingTransaction.transaction_id,
                amount: receivedAmount,
                user_id: matchingTransaction.user_id,
                bank: from,
                reference: reference,
                bank_info: bankInfo,
                is_promptpay: isPromptPay,
                confirmed_at: new Date().toISOString(),
                sms_timestamp: timestamp
            };
        }
        catch (error) {
            console.error('❌ Error confirming transaction:', error);
            throw new Error('Error confirming transaction');
        }
    }
    async findMatchingTransaction(amount) {
        try {
            return await this.transactionsService.findMatchingTransaction(amount);
        }
        catch (error) {
            console.error('Error finding matching transaction:', error);
            return null;
        }
    }
    async getTransactionByAmount(amount) {
        return null;
    }
    async getRecentSMSLogs(limit = 10) {
        return [];
    }
    async testSMSParsing(smsMessage) {
        const validation = this.smsParser.validateSMSFormat(smsMessage);
        const transactionType = this.smsParser.detectTransactionType(smsMessage);
        const amount = this.smsParser.parseAmountFromSMS(smsMessage);
        const reference = this.smsParser.extractTransactionReference(smsMessage);
        const bankInfo = this.smsParser.extractBankInfo(smsMessage);
        const isPromptPay = this.smsParser.isPromptPayTransaction(smsMessage);
        return {
            validation,
            transaction_type: transactionType,
            amount,
            reference,
            bank_info: bankInfo,
            is_promptpay: isPromptPay,
            original_message: smsMessage
        };
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sms_parser_service_1.SmsParserService,
        transactions_service_1.TransactionsService,
        users_service_1.UsersService])
], SmsService);
//# sourceMappingURL=sms.service.js.map