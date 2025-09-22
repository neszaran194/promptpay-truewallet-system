import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getRoot(): {
        message: string;
        version: string;
        status: string;
        endpoints: {
            health: string;
            users: string;
            transactions: string;
            truewallet: string;
            sms: string;
            test: string;
        };
        timestamp: string;
    };
    getHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        version: string;
        database: string;
        message: string;
    };
    handleSMSForwarder(smsData: any): Promise<{
        success: boolean;
        message: string;
        received_data: any;
        redirect_to: string;
        timestamp: string;
        note: string;
    }>;
}
