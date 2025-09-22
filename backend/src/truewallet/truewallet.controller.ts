import { Controller, Get, Post, Delete, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { TruewalletService } from './truewallet.service';

@Controller('api/truewallet')
export class TruewalletController {
  constructor(private readonly truewalletService: TruewalletService) {}

  @Post('validate')
  async validateVoucher(@Body() body: { voucherCode: string }) {
    try {
      const { voucherCode } = body;

      if (!voucherCode) {
        throw new HttpException(
          { success: false, error: 'กรุณาระบุโค้ดซองอั่งเปา' },
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.truewalletService.validateVoucher(voucherCode);
    } catch (error) {
      throw new HttpException(
        { success: false, error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('redeem')
  async redeemVoucher(@Body() body: { userId: string; voucherCode: string; phone?: string }) {
    try {
      const { userId, voucherCode, phone } = body;

      if (!userId || !voucherCode) {
        throw new HttpException(
          { success: false, error: 'กรุณาระบุ User ID และโค้ดซองอั่งเปา' },
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(`🎁 Processing voucher redemption for user: ${userId}, phone: ${phone || 'default'}`);

      const result = await this.truewalletService.redeemVoucher(userId, voucherCode, phone);

      return {
        success: true,
        message: 'แลกซองอั่งเปาสำเร็จ',
        ...result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Voucher redemption error:', error.message);

      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('history/:userId')
  async getVoucherHistory(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0'
  ) {
    try {
      const history = await this.truewalletService.getVoucherHistory(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      return {
        success: true,
        history: history,
        total: history.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Get voucher history error:', error);
      throw new HttpException(
        { success: false, error: 'ไม่สามารถดึงประวัติการแลกซองได้' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getVoucherStats() {
    try {
      const stats = await this.truewalletService.getVoucherStats();

      return {
        success: true,
        stats: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Get voucher stats error:', error);
      throw new HttpException(
        { success: false, error: 'ไม่สามารถดึงสถิติการแลกซองได้' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recent')
  async getRecentVouchers(@Query('limit') limit: string = '20') {
    try {
      const recent = await this.truewalletService.getRecentVouchers(parseInt(limit));

      return {
        success: true,
        recent_vouchers: recent,
        total: recent.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Get recent vouchers error:', error);
      throw new HttpException(
        { success: false, error: 'ไม่สามารถดึงซองล่าสุดได้' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('voucher/:voucherId')
  async deleteVoucher(@Param('voucherId') voucherId: string) {
    try {
      return await this.truewalletService.deleteVoucher(parseInt(voucherId));
    } catch (error) {
      if (error.message === 'ไม่พบข้อมูลซองอั่งเปา') {
        throw new HttpException(
          { success: false, error: 'ไม่พบข้อมูลซองอั่งเปา' },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        { success: false, error: 'ไม่สามารถลบข้อมูลซองได้' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('all')
  async getAllVouchers() {
    try {
      const vouchers = await this.truewalletService.getAllVouchers();

      return {
        success: true,
        vouchers: vouchers,
        total: vouchers.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new HttpException(
        { success: false, error: 'ไม่สามารถดึงข้อมูลซองทั้งหมดได้' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}