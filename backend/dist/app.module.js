"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const transactions_module_1 = require("./transactions/transactions.module");
const truewallet_module_1 = require("./truewallet/truewallet.module");
const users_module_1 = require("./users/users.module");
const user_entity_1 = require("./entities/user.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
const truewallet_voucher_entity_1 = require("./entities/truewallet-voucher.entity");
const sms_module_1 = require("./sms/sms.module");
const test_module_1 = require("./test/test.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'sqlite',
                database: 'database.sqlite',
                entities: [user_entity_1.User, transaction_entity_1.Transaction, truewallet_voucher_entity_1.TrueWalletVoucher],
                synchronize: true,
            }),
            transactions_module_1.TransactionsModule,
            truewallet_module_1.TruewalletModule,
            users_module_1.UsersModule,
            sms_module_1.SmsModule,
            test_module_1.TestModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map