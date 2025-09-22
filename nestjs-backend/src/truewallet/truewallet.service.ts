import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrueWalletVoucher } from '../entities/truewallet-voucher.entity';
import { UsersService } from '../users/users.service';
import { TrueWalletApiService } from '../utils/truewallet-api.service';
import { TransactionsService } from '../transactions/transactions.service';
import axios from 'axios';

@Injectable()
export class TruewalletService {
  constructor(
    @InjectRepository(TrueWalletVoucher)
    private vouchersRepository: Repository<TrueWalletVoucher>,
    private usersService: UsersService,
    private trueWalletApiService: TrueWalletApiService,
    private transactionsService: TransactionsService,
  ) {}

  async validateVoucher(voucherCode: string): Promise<any> {
    try {
      const validation = this.trueWalletApiService.validateVoucherCode(voucherCode.trim());

      if (!validation.isValid) {
        throw new Error('โค้ดซองอั่งเปาไม่ถูกต้อง');
      }

      return {
        success: true,
        validation: {
          type: validation.type,
          code: validation.cleanCode
        }
      };
    } catch (error) {
      throw new Error('โค้ดซองอั่งเปาไม่ถูกต้อง');
    }
  }

  async redeemVoucher(userId: string, voucherCode: string, phone?: string): Promise<any> {
    try {
      console.log(`🎁 Starting voucher redemption for user: ${userId}, code: ${voucherCode}`);

      // Validate and clean the voucher code
      const validation = await this.validateVoucher(voucherCode);
      const cleanCode = validation.validation.code;
      console.log(`✅ Voucher validated, clean code: ${cleanCode}`);

      // Check if voucher was already redeemed in our system
      const existingVoucher = await this.vouchersRepository.findOne({
        where: { voucher_code: cleanCode }
      });

      if (existingVoucher) {
        console.log(`❌ Voucher already redeemed in our system: ${cleanCode}`);
        throw new Error('ซองอั่งเปานี้ถูกใช้งานในระบบแล้ว');
      }

      // Use default phone number if not provided (from environment variable)
      const phoneNumber = phone || process.env.TRUEWALLET_PHONE || '0944283381';

      // Check if this is a test voucher - use fallback mode
      if (cleanCode.includes('TEST')) {
        console.log('🔄 Using fallback mode for test voucher');

        const mockResult = {
          amount: Math.floor(Math.random() * 500) + 50,
          owner_full_name: 'Test TrueWallet User',
          code: cleanCode
        };

        // Ensure user exists first
        await this.usersService.findOrCreateUser(userId);
        console.log(`👤 User ensured: ${userId}`);

        // Save voucher record
        const voucherRecord = this.vouchersRepository.create({
          user_id: userId,
          voucher_code: cleanCode,
          amount: mockResult.amount,
          owner_full_name: mockResult.owner_full_name,
          status: 'redeemed'
        });

        const savedVoucher = await this.vouchersRepository.save(voucherRecord);
        console.log(`💾 Test voucher saved:`, savedVoucher);

        // Update user credits
        const updatedUser = await this.usersService.updateCredits(userId, mockResult.amount);
        console.log(`💳 Credits updated for user ${userId}, new balance: ${updatedUser.credits}`);

        // Create transaction record for history
        await this.transactionsService.createTrueWalletTransaction(
          userId,
          mockResult.amount,
          cleanCode,
          mockResult.owner_full_name
        );
        console.log(`📝 Transaction record created for TrueWallet voucher`);

        return {
          voucher_info: {
            amount: mockResult.amount,
            owner_full_name: mockResult.owner_full_name,
            voucher_code: cleanCode
          }
        };
      }

      try {
        // Call real TrueWallet API
        console.log(`📞 Calling TrueWallet API with phone: ${phoneNumber}`);
        const apiResult = await this.trueWalletApiService.redeemVoucher(phoneNumber, voucherCode);
        console.log(`💰 TrueWallet API result:`, apiResult);

        // Ensure user exists first
        await this.usersService.findOrCreateUser(userId);
        console.log(`👤 User ensured: ${userId}`);

        // Save voucher record
        const voucherRecord = this.vouchersRepository.create({
          user_id: userId,
          voucher_code: cleanCode,
          amount: apiResult.amount,
          owner_full_name: apiResult.owner_full_name,
          status: 'redeemed'
        });

        const savedVoucher = await this.vouchersRepository.save(voucherRecord);
        console.log(`💾 Voucher saved:`, savedVoucher);

        // Update user credits
        const updatedUser = await this.usersService.updateCredits(userId, apiResult.amount);
        console.log(`💳 Credits updated for user ${userId}, new balance: ${updatedUser.credits}`);

        // Create transaction record for history
        await this.transactionsService.createTrueWalletTransaction(
          userId,
          apiResult.amount,
          cleanCode,
          apiResult.owner_full_name
        );
        console.log(`📝 Transaction record created for TrueWallet voucher`);

        return {
          voucher_info: {
            amount: apiResult.amount,
            owner_full_name: apiResult.owner_full_name,
            voucher_code: cleanCode
          }
        };

      } catch (apiError) {
        console.error('❌ TrueWallet API error:', apiError);

        // If it's a known TrueWallet error, throw the translated message
        if (apiError instanceof Error) {
          throw apiError;
        }

        throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับ TrueWallet');
      }

    } catch (error) {
      console.error('❌ TrueWallet redeem error:', error);
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