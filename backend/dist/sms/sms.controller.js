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
exports.SmsController = void 0;
const common_1 = require("@nestjs/common");
const sms_service_1 = require("./sms.service");
let SmsController = class SmsController {
    smsService;
    constructor(smsService) {
        this.smsService = smsService;
    }
    async handleSMSForwarder(smsData) {
        try {
            console.log('📱 SMS Forwarder data received:', smsData);
            const transformedData = {
                from: smsData.from || 'SMS_FORWARDER',
                message: smsData.text || smsData.message,
                timestamp: smsData.sentStamp || smsData.receivedStamp || Date.now(),
                sim: smsData.sim,
                original: smsData
            };
            console.log('🔄 Transformed SMS data:', transformedData);
            return await this.smsService.processSMSWebhook(transformedData);
        }
        catch (error) {
            console.error('❌ SMS Forwarder error:', error.message);
            return {
                success: false,
                error: error.message,
                received_data: smsData,
                timestamp: new Date().toISOString()
            };
        }
    }
    async handleSMSWebhook(smsData) {
        try {
            return await this.smsService.processSMSWebhook(smsData);
        }
        catch (error) {
            console.error('SMS webhook error:', error.message);
            if (error.message === 'No message provided') {
                throw new common_1.HttpException({
                    success: false,
                    error: 'No message provided',
                    received: smsData
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (error.message.includes('Invalid SMS format')) {
                throw new common_1.HttpException({
                    success: false,
                    error: error.message,
                    message: smsData.message || smsData.text
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (error.message === 'Amount not found in SMS') {
                throw new common_1.HttpException({
                    success: false,
                    error: 'Amount not found in SMS',
                    message: smsData.message || smsData.text,
                    type: 'incoming'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (error.message === 'Error confirming transaction') {
                throw new common_1.HttpException({
                    success: false,
                    error: 'Error confirming transaction',
                    details: error.message
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            throw new common_1.HttpException({
                success: false,
                error: 'Internal server error',
                details: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSMSLogs(limit = '10') {
        try {
            const logs = await this.smsService.getRecentSMSLogs(parseInt(limit));
            return {
                success: true,
                logs,
                total: logs.length,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({ success: false, error: 'Failed to retrieve SMS logs' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async testSMSParsing(body) {
        try {
            const { message } = body;
            if (!message) {
                throw new common_1.HttpException({ success: false, error: 'Message is required' }, common_1.HttpStatus.BAD_REQUEST);
            }
            const result = await this.smsService.testSMSParsing(message);
            return {
                success: true,
                parsing_result: result,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: 'SMS parsing test failed',
                details: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTransactionByAmount(amount) {
        try {
            if (!amount) {
                throw new common_1.HttpException({ success: false, error: 'Amount parameter is required' }, common_1.HttpStatus.BAD_REQUEST);
            }
            const transaction = await this.smsService.getTransactionByAmount(parseFloat(amount));
            return {
                success: true,
                transaction,
                amount: parseFloat(amount),
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: 'Failed to find transaction',
                details: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.SmsController = SmsController;
__decorate([
    (0, common_1.Post)('sms-forwarder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "handleSMSForwarder", null);
__decorate([
    (0, common_1.Post)('sms-webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "handleSMSWebhook", null);
__decorate([
    (0, common_1.Get)('sms-logs'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "getSMSLogs", null);
__decorate([
    (0, common_1.Post)('test-sms-parsing'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "testSMSParsing", null);
__decorate([
    (0, common_1.Get)('transaction-by-amount'),
    __param(0, (0, common_1.Query)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "getTransactionByAmount", null);
exports.SmsController = SmsController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [sms_service_1.SmsService])
], SmsController);
//# sourceMappingURL=sms.controller.js.map