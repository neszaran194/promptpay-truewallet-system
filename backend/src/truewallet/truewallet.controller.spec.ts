import { Test, TestingModule } from '@nestjs/testing';
import { TruewalletController } from './truewallet.controller';

describe('TruewalletController', () => {
  let controller: TruewalletController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TruewalletController],
    }).compile();

    controller = module.get<TruewalletController>(TruewalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
