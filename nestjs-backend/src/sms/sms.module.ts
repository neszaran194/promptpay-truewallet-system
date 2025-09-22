import { Module } from '@nestjs/common';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { SmsParserService } from '../utils/sms-parser.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TransactionsModule, UsersModule],
  controllers: [SmsController],
  providers: [SmsService, SmsParserService],
  exports: [SmsService, SmsParserService]
})
export class SmsModule {}