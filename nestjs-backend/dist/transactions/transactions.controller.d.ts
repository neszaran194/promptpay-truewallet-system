import { TransactionsService } from './transactions.service';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    createTransaction(body: {
        userId: string;
        amount: number;
    }): Promise<any>;
    getTransactionStatus(transactionId: string): Promise<any>;
    getTransactionHistory(userId: string, limit?: string, offset?: string): Promise<any>;
    deleteTransaction(transactionId: string): Promise<any>;
    deleteAllPendingTransactions(): Promise<any>;
    confirmTransaction(transactionId: string): Promise<any>;
    getStats(): Promise<any>;
    createOutgoingTransaction(body: {
        userId: string;
        amount: number;
        recipientPhone?: string;
        description?: string;
    }): Promise<any>;
    getOutgoingTransactions(userId: string, limit?: string, offset?: string): Promise<any>;
    processOutgoingPayment(body: {
        transactionId: string;
        smsData?: any;
    }): Promise<any>;
}
