export declare class PromptPayService {
    static generateRandomCents(): number;
    static generatePromptPayQR(phoneNumber: string, amount: number): string;
    static generateQRCodeImage(qrString: string): Promise<string>;
    private static calculateCRC16;
    static formatPhoneNumber(phoneNumber: string): string;
    static validateAmount(amount: number): boolean;
    static generateExpectedAmount(originalAmount: number): {
        expectedAmount: number;
        randomCents: number;
    };
}
