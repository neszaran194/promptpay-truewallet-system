import { Controller, Post, Get, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('api')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('sms-forwarder')
  async handleSMSForwarder(@Body() smsData: any) {
    try {
      console.log('📱 SMS Forwarder data received:', smsData);

      // แปลงรูปแบบจาก SMS Forwarder App เป็นรูปแบบที่ระบบเข้าใจ
      const transformedData = {
        from: smsData.from || 'SMS_FORWARDER',
        message: smsData.text || smsData.message,
        timestamp: smsData.sentStamp || smsData.receivedStamp || Date.now(),
        sim: smsData.sim,
        original: smsData
      };

      console.log('🔄 Transformed SMS data:', transformedData);

      return await this.smsService.processSMSWebhook(transformedData);
    } catch (error) {
      console.error('❌ SMS Forwarder error:', error.message);
      return {
        success: false,
        error: error.message,
        received_data: smsData,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('sms-webhook')
  async handleSMSWebhook(@Body() smsData: any) {
    try {
      return await this.smsService.processSMSWebhook(smsData);
    } catch (error) {
      console.error('SMS webhook error:', error.message);

      if (error.message === 'No message provided') {
        throw new HttpException(
          {
            success: false,
            error: 'No message provided',
            received: smsData
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error.message.includes('Invalid SMS format')) {
        throw new HttpException(
          {
            success: false,
            error: error.message,
            message: smsData.message || smsData.text
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error.message === 'Amount not found in SMS') {
        throw new HttpException(
          {
            success: false,
            error: 'Amount not found in SMS',
            message: smsData.message || smsData.text,
            type: 'incoming'
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error.message === 'Error confirming transaction') {
        throw new HttpException(
          {
            success: false,
            error: 'Error confirming transaction',
            details: error.message
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

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

  @Get('sms-logs')
  async getSMSLogs(@Query('limit') limit: string = '10') {
    try {
      const logs = await this.smsService.getRecentSMSLogs(parseInt(limit));

      return {
        success: true,
        logs,
        total: logs.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new HttpException(
        { success: false, error: 'Failed to retrieve SMS logs' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test-sms-parsing')
  async testSMSParsing(@Body() body: { message: string }) {
    try {
      const { message } = body;

      if (!message) {
        throw new HttpException(
          { success: false, error: 'Message is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.smsService.testSMSParsing(message);

      return {
        success: true,
        parsing_result: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'SMS parsing test failed',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transaction-by-amount')
  async getTransactionByAmount(@Query('amount') amount: string) {
    try {
      if (!amount) {
        throw new HttpException(
          { success: false, error: 'Amount parameter is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const transaction = await this.smsService.getTransactionByAmount(parseFloat(amount));

      return {
        success: true,
        transaction,
        amount: parseFloat(amount),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to find transaction',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}