import { Repository } from 'typeorm';
import { TrueWalletVoucher } from '../entities/truewallet-voucher.entity';
import { UsersService } from '../users/users.service';
export declare class TruewalletService {
    private vouchersRepository;
    private usersService;
    constructor(vouchersRepository: Repository<TrueWalletVoucher>, usersService: UsersService);
    validateVoucher(voucherCode: string): Promise<any>;
    redeemVoucher(userId: string, voucherCode: string): Promise<any>;
    getVoucherHistory(userId: string, limit?: number, offset?: number): Promise<any[]>;
    getVoucherStats(): Promise<any>;
    getRecentVouchers(limit?: number): Promise<any[]>;
    deleteVoucher(voucherId: number): Promise<any>;
    getAllVouchers(): Promise<any[]>;
}
