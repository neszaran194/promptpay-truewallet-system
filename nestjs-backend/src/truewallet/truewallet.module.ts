import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruewalletController } from './truewallet.controller';
import { TruewalletService } from './truewallet.service';
import { TrueWalletVoucher } from '../entities/truewallet-voucher.entity';
import { TrueWalletApiService } from '../utils/truewallet-api.service';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrueWalletVoucher]),
    UsersModule,
    TransactionsModule
  ],
  controllers: [TruewalletController],
  providers: [TruewalletService, TrueWalletApiService],
  exports: [TruewalletService]
})
export class TruewalletModule {}