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
exports.TrueWalletVoucher = void 0;
const typeorm_1 = require("typeorm");
let TrueWalletVoucher = class TrueWalletVoucher {
    id;
    user_id;
    voucher_code;
    amount;
    owner_full_name;
    status;
    redeemed_at;
};
exports.TrueWalletVoucher = TrueWalletVoucher;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TrueWalletVoucher.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TrueWalletVoucher.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TrueWalletVoucher.prototype, "voucher_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], TrueWalletVoucher.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TrueWalletVoucher.prototype, "owner_full_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'redeemed' }),
    __metadata("design:type", String)
], TrueWalletVoucher.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TrueWalletVoucher.prototype, "redeemed_at", void 0);
exports.TrueWalletVoucher = TrueWalletVoucher = __decorate([
    (0, typeorm_1.Entity)('truewallet_vouchers')
], TrueWalletVoucher);
//# sourceMappingURL=truewallet-voucher.entity.js.map