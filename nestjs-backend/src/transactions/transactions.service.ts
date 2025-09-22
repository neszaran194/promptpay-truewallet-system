import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Transaction } from '../entities/transaction.entity';
import { UsersService } from '../users/users.service';
import { PromptPayService } from '../utils/promptpay.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async createTransaction(userId: string, amount: number): Promise<any> {
    try {
      const transactionId = uuidv4();
      const phoneNumber = this.configService.get<string>('PROMPTPAY_PHONE');

      if (!phoneNumber) {
        throw new Error('PromptPay phone number not configured');
      }

      // Generate random cents for unique identification
      const { expectedAmount, randomCents } = PromptPayService.generateExpectedAmount(amount);

      console.log('💳 Creating transaction:', {
        transactionId,
        userId,
        originalAmount: amount,
        expectedAmount,
        randomCents,
        promptpayPhone: phoneNumber
      });

      // Create PromptPay QR string
      const qrString = PromptPayService.generatePromptPayQR(phoneNumber, expectedAmount);

      // Generate QR Code image
      const qrCodeUrl = await PromptPayService.generateQRCodeImage(qrString);

      // Set expiration time (5 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      // Create transaction record with expected amount
      const transaction = this.transactionsRepository.create({
        transaction_id: transactionId,
        user_id: userId,
        amount: expectedAmount, // Store expected amount for SMS matching
        status: 'pending',
        qr_code_url: qrCodeUrl,
        expires_at: expiresAt,
        payment_ref: randomCents.toString()
      });

      await this.transactionsRepository.save(transaction);

      // Calculate time remaining in milliseconds
      const timeRemaining = expiresAt.getTime() - new Date().getTime();

      return {
        success: true,
        transactionId,
        qrCodeUrl,
        amount: expectedAmount,
        originalAmount: amount,
        randomCents,
        expiresAt: expiresAt.toISOString(),
        timeRemaining,
        message: 'Transaction created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      throw new Error('Internal server error');
    }
  }

  async getTransactionStatus(transactionId: string): Promise<any> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { transaction_id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const now = new Date();
      const isExpired = now > transaction.expires_at;

      let timeRemaining = 0;
      if (!isExpired && transaction.status === 'pending') {
        timeRemaining = transaction.expires_at.getTime() - now.getTime();
      }

      // Update status if expired
      if (isExpired && transaction.status === 'pending') {
        transaction.status = 'expired';
        await this.transactionsRepository.save(transaction);
      }

      return {
        success: true,
        transaction: {
          transactionId: transaction.transaction_id,
          status: transaction.status,
          amount: Number(transaction.amount),
          timeRemaining,
          isExpired: isExpired || transaction.status === 'expired',
          createdAt: transaction.created_at
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async getTransactionHistory(userId: string, limit: number = 10, offset: number = 0): Promise<any> {
    try {
      const [transactions, total] = await this.transactionsRepository.findAndCount({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        take: Number(limit),
        skip: Number(offset)
      });

      return {
        success: true,
        transactions: transactions.map(tx => ({
          transaction_id: tx.transaction_id,
          amount: Number(tx.amount),
          status: tx.status,
          type: tx.type || 'incoming',
          created_at: tx.created_at,
          expires_at: tx.expires_at
        })),
        total,
        limit: Number(limit),
        offset: Number(offset)
      };
    } catch (error) {
      throw new Error('Database error');
    }
  }

  async deleteTransaction(transactionId: string): Promise<any> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { transaction_id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      await this.transactionsRepository.remove(transaction);

      return {
        success: true,
        message: 'Transaction deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteAllPendingTransactions(): Promise<any> {
    try {
      const result = await this.transactionsRepository.delete({
        status: 'pending'
      });

      return {
        success: true,
        message: `Deleted ${result.affected} pending transactions`
      };
    } catch (error) {
      throw new Error('Database error');
    }
  }

  async confirmTransaction(transactionId: string): Promise<any> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { transaction_id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transaction already processed');
      }

      // Update transaction status
      transaction.status = 'confirmed';
      await this.transactionsRepository.save(transaction);

      // Update user credits
      await this.usersService.updateCredits(transaction.user_id, Number(transaction.amount));

      return {
        success: true,
        message: 'Transaction confirmed successfully',
        transactionId: transaction.transaction_id,
        amount: Number(transaction.amount)
      };
    } catch (error) {
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const stats = await this.transactionsRepository
        .createQueryBuilder('transaction')
        .select('transaction.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(transaction.amount)', 'total_amount')
        .groupBy('transaction.status')
        .getRawMany();

      return {
        success: true,
        transaction_stats: stats.map(stat => ({
          status: stat.status,
          count: parseInt(stat.count),
          total_amount: parseFloat(stat.total_amount) || 0
        }))
      };
    } catch (error) {
      throw new Error('Database error');
    }
  }

  async findMatchingTransaction(amount: number): Promise<Transaction | null> {
    try {
      // Find pending transaction with matching amount that hasn't expired
      const transaction = await this.transactionsRepository.findOne({
        where: {
          amount: amount,
          status: 'pending'
        },
        order: { created_at: 'DESC' }
      });

      if (transaction) {
        const now = new Date();
        const isExpired = now > transaction.expires_at;

        if (isExpired) {
          // Mark as expired and return null
          transaction.status = 'expired';
          await this.transactionsRepository.save(transaction);
          return null;
        }

        return transaction;
      }

      return null;
    } catch (error) {
      console.error('Error finding matching transaction:', error);
      return null;
    }
  }

  async logOutgoingTransaction(from: string, smsMessage: string, amount: number, timestamp: any): Promise<void> {
    try {
      console.log('📝 Logging outgoing transaction:', { from, amount, timestamp });

      const transactionId = uuidv4();

      // Create outgoing transaction record for tracking (without user association)
      const transaction = this.transactionsRepository.create({
        transaction_id: transactionId,
        user_id: 'system_withdrawal', // Special user for withdrawal tracking
        amount: amount,
        status: 'confirmed', // Withdrawal is already completed
        type: 'outgoing',
        expires_at: new Date(), // Already expired since it's completed
        payment_ref: `SMS_${from}_${Date.now()}`,
        created_at: timestamp ? new Date(timestamp) : new Date()
      });

      await this.transactionsRepository.save(transaction);
      console.log('✅ Outgoing transaction logged successfully:', transactionId);
    } catch (error) {
      console.error('Error logging outgoing transaction:', error);
    }
  }

  async createOutgoingTransaction(
    userId: string,
    amount: number,
    recipientPhone?: string,
    description?: string
  ): Promise<any> {
    try {
      const transactionId = uuidv4();

      console.log('💸 Creating outgoing transaction:', {
        transactionId,
        userId,
        amount,
        recipientPhone,
        description
      });

      // Set expiration time (30 minutes for outgoing transactions)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      // Create outgoing transaction record
      const transaction = this.transactionsRepository.create({
        transaction_id: transactionId,
        user_id: userId,
        amount: amount,
        status: 'pending',
        type: 'outgoing',
        expires_at: expiresAt,
        payment_ref: recipientPhone || 'manual_payment'
      });

      await this.transactionsRepository.save(transaction);

      return {
        success: true,
        transactionId,
        amount,
        type: 'outgoing',
        recipientPhone,
        description,
        expiresAt: expiresAt.toISOString(),
        status: 'pending',
        message: 'Outgoing transaction created successfully',
        instructions: 'Please make the payment and SMS confirmation will be processed automatically'
      };
    } catch (error) {
      console.error('❌ Error creating outgoing transaction:', error);
      throw new Error('Internal server error');
    }
  }

  async getOutgoingTransactions(userId: string, limit: number = 10, offset: number = 0): Promise<any> {
    try {
      const [transactions, total] = await this.transactionsRepository.findAndCount({
        where: {
          user_id: userId,
          type: 'outgoing'
        },
        order: { created_at: 'DESC' },
        take: Number(limit),
        skip: Number(offset)
      });

      return {
        success: true,
        transactions: transactions.map(tx => ({
          transaction_id: tx.transaction_id,
          amount: Number(tx.amount),
          status: tx.status,
          type: tx.type,
          recipient_phone: tx.payment_ref,
          created_at: tx.created_at,
          expires_at: tx.expires_at
        })),
        total,
        limit: Number(limit),
        offset: Number(offset)
      };
    } catch (error) {
      throw new Error('Database error');
    }
  }

  async processOutgoingPayment(transactionId: string, smsData?: any): Promise<any> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: {
          transaction_id: transactionId,
          type: 'outgoing'
        }
      });

      if (!transaction) {
        throw new Error('Outgoing transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transaction already processed');
      }

      // Check if expired
      const now = new Date();
      if (now > transaction.expires_at) {
        transaction.status = 'expired';
        await this.transactionsRepository.save(transaction);
        throw new Error('Transaction expired');
      }

      // Mark as confirmed
      transaction.status = 'confirmed';
      await this.transactionsRepository.save(transaction);

      // Deduct credits from user for outgoing payment
      await this.usersService.updateCredits(transaction.user_id, -Number(transaction.amount));

      return {
        success: true,
        message: 'Outgoing payment processed successfully',
        transactionId: transaction.transaction_id,
        amount: Number(transaction.amount),
        type: 'outgoing',
        smsData: smsData || null
      };
    } catch (error) {
      throw error;
    }
  }

  async findMatchingOutgoingTransaction(amount: number): Promise<Transaction | null> {
    try {
      // Find pending outgoing transaction with matching amount
      const transaction = await this.transactionsRepository.findOne({
        where: {
          amount: amount,
          status: 'pending',
          type: 'outgoing'
        },
        order: { created_at: 'DESC' }
      });

      if (transaction) {
        const now = new Date();
        const isExpired = now > transaction.expires_at;

        if (isExpired) {
          transaction.status = 'expired';
          await this.transactionsRepository.save(transaction);
          return null;
        }

        return transaction;
      }

      return null;
    } catch (error) {
      console.error('Error finding matching outgoing transaction:', error);
      return null;
    }
  }
}