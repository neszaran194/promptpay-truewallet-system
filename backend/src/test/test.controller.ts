import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TestService } from './test.service';

@Controller('api')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post('test-qr')
  async testQRGeneration(@Body() body: { phone: string; amount: number }) {
    try {
      const { phone, amount } = body;

      if (!phone || !amount) {
        throw new HttpException(
          { success: false, error: 'Phone and amount required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.testService.testQRGeneration(phone, amount);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { success: false, error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test-sms-parse')
  testSMSParsing(@Body() body: { message: string }) {
    const { message } = body;

    if (!message) {
      throw new HttpException(
        { success: false, error: 'No message provided' },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.testService.testSMSParsing(message);
  }

  @Post('test-sms-detection')
  testSMSDetection(@Body() body: { message: string }) {
    const { message } = body;

    if (!message) {
      throw new HttpException(
        { success: false, error: 'No message provided' },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.testService.testSMSDetection(message);
  }

  @Post('test-truewallet')
  async testTrueWalletValidation(@Body() body: { voucherCode: string }) {
    try {
      const { voucherCode } = body;

      if (!voucherCode) {
        throw new HttpException(
          { success: false, error: 'Voucher code required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.testService.testTrueWalletValidation(voucherCode);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { success: false, error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test-db')
  async testDatabaseConnection() {
    try {
      return await this.testService.testDatabaseConnection();
    } catch (error) {
      throw new HttpException(
        { success: false, error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('system-info')
  getSystemInfo() {
    return this.testService.getSystemInfo();
  }

  @Get('run-all-tests')
  async runAllTests() {
    try {
      return await this.testService.runAllTests();
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to run test suite',
          details: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health-check')
  healthCheck() {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}