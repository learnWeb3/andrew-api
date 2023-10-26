import { Module } from '@nestjs/common';
import { DeviceSessionService } from './device-session/device-session.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DeviceSession,
  DeviceSessionSchema,
} from './device-session/device-session.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeviceSession.name, schema: DeviceSessionSchema },
    ]),
  ],
  providers: [DeviceSessionService],
  exports: [DeviceSessionService],
})
export class DeviceSessionModule {}
