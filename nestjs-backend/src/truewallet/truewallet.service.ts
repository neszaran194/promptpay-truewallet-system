import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrueWalletVoucher } from '../entities/truewallet-voucher.entity';
import { UsersService } from '../users/users.service';
import axios from 'axios';

@Injectable()
export class TruewalletService {
  constructor(
    @InjectRepository(TrueWalletVoucher)
    private vouchersRepository: Repository<TrueWalletVoucher>,
    private usersService: UsersService,
  ) {}

  async validateVoucher(voucherCode: string): Promise<any> {
    try {
      // Clean voucher code
      const cleanCode = voucherCode.trim();

      // Check if it's URL format
      let finalCode = cleanCode;
      if (cleanCode.includes('wallet.truemoney.com')) {
        const urlParts = cleanCode.split('/');
        finalCode = urlParts[urlParts.length - 1];
      }

      // Basic validation
      if (finalCode.length < 10) {
        throw new Error('โค้ดซองอั่งเปาไม่ถูกต้อง');
      }

      return {
        success: true,
        validation: {
          type: cleanCode.includes('wallet.truemoney.com') ? 'url' : 'code',
          code: finalCode
        }
      };
    } catch (error) {
      throw new Error('โค้ดซองอั่งเปาไม่ถูกต้อง');
    }
  }

  async redeemVoucher(userId: string, voucherCode: string): Promise<any> {
    try {
      // Validate and clean the voucher code
      const validation = await this.validateVoucher(voucherCode);
      const cleanCode = validation.validation.code;

      // Check if voucher was already redeemed
      const existingVoucher = await this.vouchersRepository.findOne({
        where: { voucher_code: cleanCode }
      });

      if (existingVoucher) {
        throw new Error('ซองอั่งเปานี้ถูกใช้งานแล้ว');
      }

      // Mock API response (replace with actual API when available)
      // In production, this would call the actual TrueWallet API
      const result = {
        success: true,
        voucher_info: {
          amount: 100,
          owner_full_name: 'Test User',
          message: 'Test voucher redemption'
        }
      };

      if (!result.success) {
        throw new Error('ไม่สามารถแลกซองอั่งเปาได้');
      }

      const { voucher_info } = result;

      // Save voucher record
      const voucherRecord = this.vouchersRepository.create({
        user_id: userId,
        voucher_code: cleanCode,
        amount: voucher_info.amount,
        owner_full_name: voucher_info.owner_full_name,
        status: 'redeemed'
      });

      await this.vouchersRepository.save(voucherRecord);

      // Update user credits
      await this.usersService.updateCredits(userId, voucher_info.amount);

      return {
        voucher_info: {
          amount: voucher_info.amount,
          owner_full_name: voucher_info.owner_full_name,
          voucher_code: cleanCode
        }
      };

    } catch (error) {
      console.error('TrueWallet redeem error:', error);
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการแลกซอง');
    }
  }

  async getVoucherHistory(userId: string, limit: number = 10, offset: number = 0): Promise<any[]> {
    try {
      const vouchers = await this.vouchersRepository.find({
        where: { user_id: userId },
        order: { redeemed_at: 'DESC' },
        take: Number(limit),
        skip: Number(offset)
      });

      return vouchers.map(voucher => ({
        voucher_code: voucher.voucher_code,
        amount: Number(voucher.amount),
        owner_full_name: voucher.owner_full_name,
        redeemed_at: voucher.redeemed_at,
        status: voucher.status
      }));
    } catch (error) {
      throw new Error('ไม่สามารถดึงประวัติการแลกซองได้');
    }
  }

  async getVoucherStats(): Promise<any> {
    try {
      const stats = await this.vouchersRepository
        .createQueryBuilder('voucher')
        .select('COUNT(*)', 'total_redeemed')
        .addSelect('SUM(voucher.amount)', 'total_amount')
        .addSelect('AVG(voucher.amount)', 'average_amount')
        .getRawOne();

      return {
        total_redeemed: parseInt(stats.total_redeemed) || 0,
        total_amount: parseFloat(stats.total_amount) || 0,
        average_amount: parseFloat(stats.average_amount) || 0
      };
    } catch (error) {
      throw new Error('ไม่สามารถดึงสถิติการแลกซองได้');
    }
  }

  async getRecentVouchers(limit: number = 20): Promise<any[]> {
    try {
      const recent = await this.vouchersRepository.find({
        order: { redeemed_at: 'DESC' },
        take: Number(limit)
      });

      return recent.map(voucher => ({
        id: voucher.id,
        user_id: voucher.user_id,
        voucher_code: voucher.voucher_code,
        amount: Number(voucher.amount),
        owner_full_name: voucher.owner_full_name,
        redeemed_at: voucher.redeemed_at,
        status: voucher.status
      }));
    } catch (error) {
      throw new Error('ไม่สามารถดึงข้อมูลซองล่าสุดได้');
    }
  }

  async deleteVoucher(voucherId: number): Promise<any> {
    try {
      const voucher = await this.vouchersRepository.findOne({
        where: { id: voucherId }
      });

      if (!voucher) {
        throw new Error('ไม่พบข้อมูลซองอั่งเปา');
      }

      await this.vouchersRepository.remove(voucher);

      return {
        success: true,
        message: 'ลบข้อมูลซองอั่งเปาสำเร็จ'
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllVouchers(): Promise<any[]> {
    try {
      const vouchers = await this.vouchersRepository.find({
        order: { redeemed_at: 'DESC' }
      });

      return vouchers.map(voucher => ({
        id: voucher.id,
        user_id: voucher.user_id,
        voucher_code: voucher.voucher_code,
        amount: Number(voucher.amount),
        owner_full_name: voucher.owner_full_name,
        redeemed_at: voucher.redeemed_at,
        status: voucher.status
      }));
    } catch (error) {
      throw new Error('ไม่สามารถดึงข้อมูลซองทั้งหมดได้');
    }
  }
}