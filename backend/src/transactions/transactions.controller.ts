import { Controller, Get, Post, Delete, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('api')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('create-transaction')
  async createTransaction(@Body() body: { userId: string; amount: number }) {
    try {
      const { userId, amount } = body;

      if (!userId || !amount || amount <= 0) {
        throw new HttpException(
          { success: false, error: 'Invalid user ID or amount' },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.transactionsService.createTransaction(userId, amount);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('❌ Error creating transaction:', error);
      throw new HttpException(
        {
          success: false,
          error: 'Internal server error',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transaction-status/:transactionId')
  async getTransactionStatus(@Param('transactionId') transactionId: string) {
    try {
      return await this.transactionsService.getTransactionStatus(transactionId);
    } catch (error) {
      if (error.message === 'Transaction not found') {
        throw new HttpException(
          { success: false, error: 'Transaction not found' },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        { success: false, error: 'Database error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transactions/:userId')
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0'
  ) {
    try {
      return await this.transactionsService.getTransactionHistory(
        userId,
        parseInt(limit),
        parseInt(offset)
      );
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new HttpException(
        { success: false, error: 'Database error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('transaction/:transactionId')
  async deleteTransaction(@Param('transactionId') transactionId: string) {
    try {
      return await this.transactionsService.deleteTransaction(transactionId);
    } catch (error) {
      if (error.message === 'Transaction not found') {
        throw new HttpException(
          { success: false, error: 'Transaction not found' },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        { success: false, error: 'Database error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('transactions/pending')
  async deleteAllPendingTransactions() {
    try {
      return await this.transactionsService.deleteAllPendingTransactions();
    } catch (error) {
      console.error('❌ Error deleting pending transactions:', error);
      throw new HttpException(
        { success: false, error: 'Database error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('confirm-transaction/:transactionId')
  async confirmTransaction(@Param('transactionId') transactionId: string) {
    try {
      return await this.transactionsService.confirmTransaction(transactionId);
    } catch (error) {
      if (error.message === 'Transaction not found') {
        throw new HttpException(
          { success: false, error: 'Transaction not found' },
          HttpStatus.NOT_FOUND,
        );
      }
      if (error.message === 'Transaction already processed') {
        throw new HttpException(
          { success: false, error: 'Transaction already processed' },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        { success: false, error: 'Database error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getStats() {
    try {
      return await this.transactionsService.getStats();
    } catch (error) {
      throw new HttpException(
        { success: false, error: 'Database error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-outgoing-transaction')
  async createOutgoingTransaction(@Body() body: {
    userId: string;
    amount: number;
    recipientPhone?: string;
    description?: string;
  }) {
    try {
      const { userId, amount, recipientPhone, description } = body;

      if (!userId || !amount || amount <= 0) {
        throw new HttpException(
          { success: false, error: 'Invalid user ID or amount' },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.transactionsService.createOutgoingTransaction(
        userId,
        amount,
        recipientPhone,
        description
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('❌ Error creating outgoing transaction:', error);
      throw new HttpException(
        {
          success: false,
          error: 'Internal server error',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('outgoing-transactions/:userId')
  async getOutgoingTransactions(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0'
  ) {
    try {
      return await this.transactionsService.getOutgoingTransactions(
        userId,
        parseInt(limit),
        parseInt(offset)
      );
    } catch (error) {
      console.error('❌ Database error:', error);
      throw new HttpException(
        { success: false, error: 'Database error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('process-outgoing-payment')
  async processOutgoingPayment(@Body() body: {
    transactionId: string;
    smsData?: any;
  }) {
    try {
      const { transactionId, smsData } = body;

      if (!transactionId) {
        throw new HttpException(
          { success: false, error: 'Transaction ID is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.transactionsService.processOutgoingPayment(transactionId, smsData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('❌ Error processing outgoing payment:', error);
      throw new HttpException(
        {
          success: false,
          error: 'Internal server error',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}