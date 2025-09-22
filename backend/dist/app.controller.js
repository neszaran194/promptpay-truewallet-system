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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getRoot() {
        return {
            message: 'PromptPay & TrueWallet API Server',
            version: '1.0.0',
            status: 'running',
            endpoints: {
                health: '/api/health',
                users: '/api/user-credits/:userId',
                transactions: '/api/create-transaction',
                truewallet: '/api/truewallet/redeem',
                sms: '/api/sms-webhook',
                test: '/api/run-all-tests'
            },
            timestamp: new Date().toISOString()
        };
    }
    getHealth() {
        return {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0',
            database: 'connected',
            message: 'PromptPay & TrueWallet API is healthy'
        };
    }
    async handleSMSForwarder(smsData) {
        console.log('📱 SMS Forwarder data received at root:', smsData);
        return {
            success: true,
            message: 'SMS received at root endpoint',
            received_data: smsData,
            redirect_to: '/api/sms-webhook',
            timestamp: new Date().toISOString(),
            note: 'Please configure your SMS forwarder to use /api/sms-webhook endpoint'
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getRoot", null);
__decorate([
    (0, common_1.Get)('api/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "handleSMSForwarder", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map