import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceService } from './ecommerce.service';

describe('EcommerceService', () => {
  let service: EcommerceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EcommerceService],
    }).compile();

    service = module.get<EcommerceService>(EcommerceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
