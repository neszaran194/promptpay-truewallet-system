import { TestService } from './test.service';
export declare class TestController {
    private readonly testService;
    constructor(testService: TestService);
    testQRGeneration(body: {
        phone: string;
        amount: number;
    }): Promise<any>;
    testSMSParsing(body: {
        message: string;
    }): any;
    testSMSDetection(body: {
        message: string;
    }): any;
    testTrueWalletValidation(body: {
        voucherCode: string;
    }): Promise<any>;
    testDatabaseConnection(): Promise<any>;
    getSystemInfo(): any;
    runAllTests(): Promise<any>;
    healthCheck(): {
        success: boolean;
        status: string;
        timestamp: string;
        uptime: number;
        version: string;
        environment: string;
    };
}
