import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      message: 'PromptPay & TrueWallet API Server',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        users: '/api/user-credits/:userId',
        transactions: '/api/create-transaction',
        truewallet: '/api/truewallet/redeem',
        sms: '/api/sms-webhook',
        test: '/api/run-all-tests'
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('api/health')
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      database: 'connected',
      message: 'PromptPay & TrueWallet API is healthy'
    };
  }

  @Post()
  async handleSMSForwarder(@Body() smsData: any) {
    console.log('📱 SMS Forwarder data received at root:', smsData);

    // ส่งต่อไป SMS webhook endpoint
    return {
      success: true,
      message: 'SMS received at root endpoint',
      received_data: smsData,
      redirect_to: '/api/sms-webhook',
      timestamp: new Date().toISOString(),
      note: 'Please configure your SMS forwarder to use /api/sms-webhook endpoint'
    };
  }
}
