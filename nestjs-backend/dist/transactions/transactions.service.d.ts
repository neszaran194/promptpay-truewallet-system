import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Transaction } from '../entities/transaction.entity';
import { UsersService } from '../users/users.service';
export declare class TransactionsService {
    private transactionsRepository;
    private usersService;
    private configService;
    constructor(transactionsRepository: Repository<Transaction>, usersService: UsersService, configService: ConfigService);
    createTransaction(userId: string, amount: number): Promise<any>;
    getTransactionStatus(transactionId: string): Promise<any>;
    getTransactionHistory(userId: string, limit?: number, offset?: number): Promise<any>;
    deleteTransaction(transactionId: string): Promise<any>;
    deleteAllPendingTransactions(): Promise<any>;
    confirmTransaction(transactionId: string): Promise<any>;
    getStats(): Promise<any>;
    findMatchingTransaction(amount: number): Promise<Transaction | null>;
    logOutgoingTransaction(from: string, smsMessage: string, amount: number, timestamp: any): Promise<void>;
    createOutgoingTransaction(userId: string, amount: number, recipientPhone?: string, description?: string): Promise<any>;
    getOutgoingTransactions(userId: string, limit?: number, offset?: number): Promise<any>;
    processOutgoingPayment(transactionId: string, smsData?: any): Promise<any>;
    findMatchingOutgoingTransaction(amount: number): Promise<Transaction | null>;
    createTrueWalletTransaction(userId: string, amount: number, voucherCode: string, ownerFullName: string): Promise<any>;
}
