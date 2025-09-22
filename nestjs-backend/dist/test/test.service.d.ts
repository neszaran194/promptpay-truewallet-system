import { ConfigService } from '@nestjs/config';
import { SmsParserService } from '../utils/sms-parser.service';
export declare class TestService {
    private configService;
    private smsParser;
    constructor(configService: ConfigService, smsParser: SmsParserService);
    testQRGeneration(phone: string, amount: number): Promise<any>;
    testSMSParsing(message: string): any;
    testSMSDetection(message: string): any;
    testTrueWalletValidation(voucherCode: string): Promise<any>;
    testDatabaseConnection(): Promise<any>;
    getSystemInfo(): any;
    runAllTests(): Promise<any>;
}
