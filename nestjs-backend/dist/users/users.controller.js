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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getUserCredits(userId) {
        try {
            return await this.usersService.getUserCredits(userId);
        }
        catch (error) {
            throw new common_1.HttpException({ success: false, error: 'Database error' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async fixUserCredits(userId, body) {
        const { amount } = body;
        if (!amount) {
            throw new common_1.HttpException({ success: false, error: 'Amount required' }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            return await this.usersService.fixUserCredits(userId, amount);
        }
        catch (error) {
            throw new common_1.HttpException({ success: false, error: 'Database error' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('user-credits/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserCredits", null);
__decorate([
    (0, common_1.Post)('fix-credits/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "fixUserCredits", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map