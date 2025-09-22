import { SmsService } from './sms.service';
export declare class SmsController {
    private readonly smsService;
    constructor(smsService: SmsService);
    handleSMSForwarder(smsData: any): Promise<any>;
    handleSMSWebhook(smsData: any): Promise<any>;
    getSMSLogs(limit?: string): Promise<{
        success: boolean;
        logs: any[];
        total: number;
        timestamp: string;
    }>;
    testSMSParsing(body: {
        message: string;
    }): Promise<{
        success: boolean;
        parsing_result: any;
        timestamp: string;
    }>;
    getTransactionByAmount(amount: string): Promise<{
        success: boolean;
        transaction: any;
        amount: number;
        timestamp: string;
    }>;
}
