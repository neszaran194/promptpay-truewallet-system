export declare class SmsParserService {
    detectTransactionType(smsMessage: string): 'incoming' | 'outgoing' | 'unknown';
    parseAmountFromSMS(smsMessage: string): number | null;
    extractTransactionReference(smsMessage: string): string | null;
    extractBankInfo(smsMessage: string): {
        bank?: string;
        account?: string;
    };
    isPromptPayTransaction(smsMessage: string): boolean;
    validateSMSFormat(smsMessage: string): {
        isValid: boolean;
        reason?: string;
    };
}
