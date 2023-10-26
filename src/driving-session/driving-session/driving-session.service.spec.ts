import { Test, TestingModule } from '@nestjs/testing';
import { DrivingSessionService } from './driving-session.service';

describe('DrivingSessionService', () => {
  let service: DrivingSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DrivingSessionService],
    }).compile();

    service = module.get<DrivingSessionService>(DrivingSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
