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
exports.TestController = void 0;
const common_1 = require("@nestjs/common");
const test_service_1 = require("./test.service");
let TestController = class TestController {
    testService;
    constructor(testService) {
        this.testService = testService;
    }
    async testQRGeneration(body) {
        try {
            const { phone, amount } = body;
            if (!phone || !amount) {
                throw new common_1.HttpException({ success: false, error: 'Phone and amount required' }, common_1.HttpStatus.BAD_REQUEST);
            }
            return await this.testService.testQRGeneration(phone, amount);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({ success: false, error: error.message }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    testSMSParsing(body) {
        const { message } = body;
        if (!message) {
            throw new common_1.HttpException({ success: false, error: 'No message provided' }, common_1.HttpStatus.BAD_REQUEST);
        }
        return this.testService.testSMSParsing(message);
    }
    testSMSDetection(body) {
        const { message } = body;
        if (!message) {
            throw new common_1.HttpException({ success: false, error: 'No message provided' }, common_1.HttpStatus.BAD_REQUEST);
        }
        return this.testService.testSMSDetection(message);
    }
    async testTrueWalletValidation(body) {
        try {
            const { voucherCode } = body;
            if (!voucherCode) {
                throw new common_1.HttpException({ success: false, error: 'Voucher code required' }, common_1.HttpStatus.BAD_REQUEST);
            }
            return await this.testService.testTrueWalletValidation(voucherCode);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({ success: false, error: error.message }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async testDatabaseConnection() {
        try {
            return await this.testService.testDatabaseConnection();
        }
        catch (error) {
            throw new common_1.HttpException({ success: false, error: error.message }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getSystemInfo() {
        return this.testService.getSystemInfo();
    }
    async runAllTests() {
        try {
            return await this.testService.runAllTests();
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                error: 'Failed to run test suite',
                details: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    healthCheck() {
        return {
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };
    }
};
exports.TestController = TestController;
__decorate([
    (0, common_1.Post)('test-qr'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "testQRGeneration", null);
__decorate([
    (0, common_1.Post)('test-sms-parse'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "testSMSParsing", null);
__decorate([
    (0, common_1.Post)('test-sms-detection'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "testSMSDetection", null);
__decorate([
    (0, common_1.Post)('test-truewallet'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "testTrueWalletValidation", null);
__decorate([
    (0, common_1.Get)('test-db'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "testDatabaseConnection", null);
__decorate([
    (0, common_1.Get)('system-info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getSystemInfo", null);
__decorate([
    (0, common_1.Get)('run-all-tests'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestController.prototype, "runAllTests", null);
__decorate([
    (0, common_1.Get)('health-check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestController.prototype, "healthCheck", null);
exports.TestController = TestController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [test_service_1.TestService])
], TestController);
//# sourceMappingURL=test.controller.js.map