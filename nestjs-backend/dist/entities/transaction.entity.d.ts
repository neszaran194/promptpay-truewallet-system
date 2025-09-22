export declare class Transaction {
    id: number;
    transaction_id: string;
    user_id: string;
    amount: number;
    status: string;
    type: string;
    qr_code_url: string;
    expires_at: Date;
    payment_ref: string;
    created_at: Date;
    updated_at: Date;
}
