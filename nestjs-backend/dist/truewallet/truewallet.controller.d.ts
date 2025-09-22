import { TruewalletService } from './truewallet.service';
export declare class TruewalletController {
    private readonly truewalletService;
    constructor(truewalletService: TruewalletService);
    validateVoucher(body: {
        voucherCode: string;
    }): Promise<any>;
    redeemVoucher(body: {
        userId: string;
        voucherCode: string;
        phone?: string;
    }): Promise<any>;
    getVoucherHistory(userId: string, limit?: string, offset?: string): Promise<{
        success: boolean;
        history: any[];
        total: number;
        timestamp: string;
    }>;
    getVoucherStats(): Promise<{
        success: boolean;
        stats: any;
        timestamp: string;
    }>;
    getRecentVouchers(limit?: string): Promise<{
        success: boolean;
        recent_vouchers: any[];
        total: number;
        timestamp: string;
    }>;
    deleteVoucher(voucherId: string): Promise<any>;
    getAllVouchers(): Promise<{
        success: boolean;
        vouchers: any[];
        total: number;
        timestamp: string;
    }>;
}
