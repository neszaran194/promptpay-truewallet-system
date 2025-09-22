import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from '../entities/transaction.entity';
import { UsersModule } from '../users/users.module';
import { PromptPayService } from '../utils/promptpay.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    UsersModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, PromptPayService],
  exports: [TransactionsService, PromptPayService]
})
export class TransactionsModule {}