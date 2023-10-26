import { Module } from '@nestjs/common';
import { DrivingSessionService } from './driving-session/driving-session.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DrivingSession,
  DrivingSessionSchema,
} from './driving-session/device-session.schemas';

@Module({
  providers: [DrivingSessionService],
  imports: [
    MongooseModule.forFeature([
      { name: DrivingSession.name, schema: DrivingSessionSchema },
    ]),
  ],
  exports: [DrivingSessionService],
})
export class DrivingSessionModule {}
