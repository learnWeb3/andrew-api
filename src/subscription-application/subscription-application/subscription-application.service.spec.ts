import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionApplicationService } from './subscription-application.service';

describe('SubscriptionApplicationService', () => {
  let service: SubscriptionApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionApplicationService],
    }).compile();

    service = module.get<SubscriptionApplicationService>(SubscriptionApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
