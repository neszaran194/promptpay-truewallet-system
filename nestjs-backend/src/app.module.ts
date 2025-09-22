import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { TruewalletModule } from './truewallet/truewallet.module';
import { UsersModule } from './users/users.module';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { TrueWalletVoucher } from './entities/truewallet-voucher.entity';
import { SmsModule } from './sms/sms.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Transaction, TrueWalletVoucher],
      synchronize: true,
    }),
    TransactionsModule,
    TruewalletModule,
    UsersModule,
    SmsModule,
    TestModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
