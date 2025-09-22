import { Repository } from 'typeorm';
import { TrueWalletVoucher } from '../entities/truewallet-voucher.entity';
import { UsersService } from '../users/users.service';
import { TrueWalletApiService } from '../utils/truewallet-api.service';
import { TransactionsService } from '../transactions/transactions.service';
export declare class TruewalletService {
    private vouchersRepository;
    private usersService;
    private trueWalletApiService;
    private transactionsService;
    constructor(vouchersRepository: Repository<TrueWalletVoucher>, usersService: UsersService, trueWalletApiService: TrueWalletApiService, transactionsService: TransactionsService);
    validateVoucher(voucherCode: string): Promise<any>;
    redeemVoucher(userId: string, voucherCode: string, phone?: string): Promise<any>;
    getVoucherHistory(userId: string, limit?: number, offset?: number): Promise<any[]>;
    getVoucherStats(): Promise<any>;
    getRecentVouchers(limit?: number): Promise<any[]>;
    deleteVoucher(voucherId: number): Promise<any>;
    getAllVouchers(): Promise<any[]>;
}
