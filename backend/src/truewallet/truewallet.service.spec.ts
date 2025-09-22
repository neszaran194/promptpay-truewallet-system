import { Test, TestingModule } from '@nestjs/testing';
import { TruewalletService } from './truewallet.service';

describe('TruewalletService', () => {
  let service: TruewalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TruewalletService],
    }).compile();

    service = module.get<TruewalletService>(TruewalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
