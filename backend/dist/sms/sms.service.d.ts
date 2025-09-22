import { SmsParserService } from '../utils/sms-parser.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
export declare class SmsService {
    private smsParser;
    private transactionsService;
    private usersService;
    constructor(smsParser: SmsParserService, transactionsService: TransactionsService, usersService: UsersService);
    processSMSWebhook(smsData: any): Promise<any>;
    private handleOutgoingTransaction;
    private handleIncomingTransaction;
    private findMatchingTransaction;
    getTransactionByAmount(amount: number): Promise<any>;
    getRecentSMSLogs(limit?: number): Promise<any[]>;
    testSMSParsing(smsMessage: string): Promise<any>;
}
