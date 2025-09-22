import { Injectable } from '@nestjs/common';
import { SmsParserService } from '../utils/sms-parser.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SmsService {
  constructor(
    private smsParser: SmsParserService,
    private transactionsService: TransactionsService,
    private usersService: UsersService,
  ) {}

  async processSMSWebhook(smsData: any): Promise<any> {
    console.log('📱 SMS webhook received');

    try {
      const { from, message, text, timestamp } = smsData;
      console.log('SMS data:', smsData);

      // รองรับทั้ง "message" และ "text" field
      const smsMessage = message || text;

      if (!smsMessage) {
        console.log('❌ No message or text field provided');
        throw new Error('No message provided');
      }

      console.log('🔍 Processing SMS message:', smsMessage);
      console.log('📤 Message length:', smsMessage.length, 'chars');

      // ตรวจสอบรูปแบบ SMS
      const validation = this.smsParser.validateSMSFormat(smsMessage);
      if (!validation.isValid) {
        throw new Error(`Invalid SMS format: ${validation.reason}`);
      }

      // ตรวจสอบประเภทของ SMS
      const transactionType = this.smsParser.detectTransactionType(smsMessage);
      console.log('💳 Transaction type detected:', transactionType);

      // ถ้าเป็นเงินออก ให้ log ไว้แต่ไม่ process
      if (transactionType === 'outgoing') {
        return await this.handleOutgoingTransaction(from, smsMessage, timestamp);
      }

      // ถ้าไม่ใช่เงินเข้า ให้ skip
      if (transactionType !== 'incoming') {
        console.log('ℹ️ SMS is not incoming transaction:', transactionType);
        return {
          success: true,
          message: 'SMS processed but not incoming transaction',
          type: transactionType,
          bank: from
        };
      }

      // ประมวลผลเงินเข้าตามปกติ
      return await this.handleIncomingTransaction(from, smsMessage, timestamp);

    } catch (error) {
      console.error('❌ SMS processing error:', error);
      throw error;
    }
  }

  private async handleOutgoingTransaction(from: string, smsMessage: string, timestamp: any): Promise<any> {
    console.log('💸 Outgoing transaction detected - checking for matching pending transactions');

    const outgoingAmount = this.smsParser.parseAmountFromSMS(smsMessage);

    if (!outgoingAmount) {
      return {
        success: true,
        message: 'Outgoing transaction detected but amount not parsed',
        type: 'outgoing',
        bank: from,
        processed: false,
        raw_message: smsMessage
      };
    }

    console.log('💰 Outgoing amount detected:', outgoingAmount, 'THB');

    // หา outgoing transaction ที่ตรงกันและยังไม่หมดอายุ
    const matchingOutgoingTransaction = await this.transactionsService.findMatchingOutgoingTransaction(outgoingAmount);

    if (!matchingOutgoingTransaction) {
      console.log('ℹ️ No matching outgoing transaction found for amount:', outgoingAmount);

      // Log outgoing transaction สำหรับ tracking
      await this.transactionsService.logOutgoingTransaction(from, smsMessage, outgoingAmount, timestamp);

      return {
        success: true,
        message: 'Outgoing transaction logged (no matching pending transaction)',
        type: 'outgoing',
        amount: outgoingAmount,
        bank: from,
        processed: false,
        note: 'No pending outgoing transaction found to match this SMS'
      };
    }

    console.log('✅ Found matching outgoing transaction:', matchingOutgoingTransaction.transaction_id);

    // ประมวลผล outgoing payment
    try {
      const processResult = await this.transactionsService.processOutgoingPayment(
        matchingOutgoingTransaction.transaction_id,
        { from, smsMessage, timestamp }
      );

      console.log('🎉 Outgoing payment processed successfully!');

      // ดึงข้อมูลเพิ่มเติม
      const reference = this.smsParser.extractTransactionReference(smsMessage);
      const bankInfo = this.smsParser.extractBankInfo(smsMessage);

      return {
        success: true,
        message: 'Outgoing payment confirmed successfully',
        transaction_id: matchingOutgoingTransaction.transaction_id,
        amount: outgoingAmount,
        user_id: matchingOutgoingTransaction.user_id,
        bank: from,
        reference: reference,
        bank_info: bankInfo,
        type: 'outgoing',
        confirmed_at: new Date().toISOString(),
        sms_timestamp: timestamp,
        processed: true
      };

    } catch (error) {
      console.error('❌ Error processing outgoing payment:', error);
      return {
        success: false,
        error: 'Error processing outgoing payment',
        transaction_id: matchingOutgoingTransaction.transaction_id,
        amount: outgoingAmount,
        bank: from,
        details: error.message
      };
    }
  }

  private async handleIncomingTransaction(from: string, smsMessage: string, timestamp: any): Promise<any> {
    const receivedAmount = this.smsParser.parseAmountFromSMS(smsMessage);

    if (!receivedAmount) {
      console.log('❌ Amount not found in SMS:', smsMessage);
      throw new Error('Amount not found in SMS');
    }

    console.log('💰 Amount detected:', receivedAmount, 'THB');

    // หา transaction ที่ตรงกันและยังไม่หมดอายุ
    const matchingTransaction = await this.findMatchingTransaction(receivedAmount);

    if (!matchingTransaction) {
      console.log('❌ No matching transaction found for amount:', receivedAmount);
      return {
        success: false,
        error: 'No matching transaction found',
        amount: receivedAmount,
        bank: from,
        suggestions: 'อาจจะมีการโอนเงินที่ไม่ได้ระบุใน transaction หรือ transaction หมดอายุแล้ว'
      };
    }

    console.log('✅ Found matching transaction:', matchingTransaction.transaction_id);

    // ยืนยัน transaction
    try {
      const confirmResult = await this.transactionsService.confirmTransaction(
        matchingTransaction.transaction_id
      );

      console.log('🎉 Transaction confirmed successfully!');

      // ดึงข้อมูลเพิ่มเติม
      const reference = this.smsParser.extractTransactionReference(smsMessage);
      const bankInfo = this.smsParser.extractBankInfo(smsMessage);
      const isPromptPay = this.smsParser.isPromptPayTransaction(smsMessage);

      return {
        success: true,
        message: 'Payment confirmed successfully',
        transaction_id: matchingTransaction.transaction_id,
        amount: receivedAmount,
        user_id: matchingTransaction.user_id,
        bank: from,
        reference: reference,
        bank_info: bankInfo,
        is_promptpay: isPromptPay,
        confirmed_at: new Date().toISOString(),
        sms_timestamp: timestamp
      };

    } catch (error) {
      console.error('❌ Error confirming transaction:', error);
      throw new Error('Error confirming transaction');
    }
  }

  private async findMatchingTransaction(amount: number): Promise<any> {
    try {
      return await this.transactionsService.findMatchingTransaction(amount);
    } catch (error) {
      console.error('Error finding matching transaction:', error);
      return null;
    }
  }

  async getTransactionByAmount(amount: number): Promise<any> {
    // TODO: Implement transaction lookup by amount
    return null;
  }

  async getRecentSMSLogs(limit: number = 10): Promise<any[]> {
    // TODO: Implement SMS log retrieval
    return [];
  }

  async testSMSParsing(smsMessage: string): Promise<any> {
    const validation = this.smsParser.validateSMSFormat(smsMessage);
    const transactionType = this.smsParser.detectTransactionType(smsMessage);
    const amount = this.smsParser.parseAmountFromSMS(smsMessage);
    const reference = this.smsParser.extractTransactionReference(smsMessage);
    const bankInfo = this.smsParser.extractBankInfo(smsMessage);
    const isPromptPay = this.smsParser.isPromptPayTransaction(smsMessage);

    return {
      validation,
      transaction_type: transactionType,
      amount,
      reference,
      bank_info: bankInfo,
      is_promptpay: isPromptPay,
      original_message: smsMessage
    };
  }
}