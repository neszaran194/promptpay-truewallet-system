"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruewalletModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const truewallet_controller_1 = require("./truewallet.controller");
const truewallet_service_1 = require("./truewallet.service");
const truewallet_voucher_entity_1 = require("../entities/truewallet-voucher.entity");
const truewallet_api_service_1 = require("../utils/truewallet-api.service");
const users_module_1 = require("../users/users.module");
const transactions_module_1 = require("../transactions/transactions.module");
let TruewalletModule = class TruewalletModule {
};
exports.TruewalletModule = TruewalletModule;
exports.TruewalletModule = TruewalletModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([truewallet_voucher_entity_1.TrueWalletVoucher]),
            users_module_1.UsersModule,
            transactions_module_1.TransactionsModule
        ],
        controllers: [truewallet_controller_1.TruewalletController],
        providers: [truewallet_service_1.TruewalletService, truewallet_api_service_1.TrueWalletApiService],
        exports: [truewallet_service_1.TruewalletService]
    })
], TruewalletModule);
//# sourceMappingURL=truewallet.module.js.map