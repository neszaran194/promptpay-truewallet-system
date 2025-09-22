import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { SmsParserService } from '../utils/sms-parser.service';

@Module({
  controllers: [TestController],
  providers: [TestService, SmsParserService],
  exports: [TestService]
})
export class TestModule {}