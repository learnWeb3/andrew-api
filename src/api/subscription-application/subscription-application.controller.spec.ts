import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionApplicationController } from './subscription-application.controller';

describe('SubscriptionApplicationController', () => {
  let controller: SubscriptionApplicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionApplicationController],
    }).compile();

    controller = module.get<SubscriptionApplicationController>(
      SubscriptionApplicationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
