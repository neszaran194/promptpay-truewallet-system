import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruewalletController } from './truewallet.controller';
import { TruewalletService } from './truewallet.service';
import { TrueWalletVoucher } from '../entities/truewallet-voucher.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrueWalletVoucher]),
    UsersModule
  ],
  controllers: [TruewalletController],
  providers: [TruewalletService],
  exports: [TruewalletService]
})
export class TruewalletModule {}