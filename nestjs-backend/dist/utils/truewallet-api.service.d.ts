interface TrueWalletRedeemResponse {
    amount: number;
    owner_full_name: string;
    code: string;
}
export declare class TrueWalletApiService {
    redeemVoucher(phone: string, voucherData: string): Promise<TrueWalletRedeemResponse>;
    private translateError;
    validateVoucherCode(voucherData: string): {
        isValid: boolean;
        cleanCode: string;
        type: 'url' | 'code';
    };
}
export {};
