import { Module, forwardRef } from '@nestjs/common';
import { DeviceService } from './device/device.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './device/device.schemas';
import { EventSchema } from './device/event.schemas';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import {
  DataTransmission,
  DataTransmissionSchema,
} from './device/data-transmission';
import { DataScoring, DataScoringSchema } from './device/data-scoring';
import {
  DeviceSession,
  DeviceSessionSchema,
} from 'src/device-session/device-session/device-session.schemas';
import { CustomerModule } from 'src/customer/customer.module';
import { ContractModule } from 'src/contract/contract.module';

@Module({
  providers: [DeviceService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Device.name,
        schema: DeviceSchema,
      },
      {
        name: Event.name,
        schema: EventSchema,
      },
      {
        name: DataTransmission.name,
        schema: DataTransmissionSchema,
      },
      {
        name: DataScoring.name,
        schema: DataScoringSchema,
      },
      {
        name: DeviceSession.name,
        schema: DeviceSessionSchema,
      },
    ]),
    forwardRef(() => KeycloakModule),
    forwardRef(() => VehicleModule),
    forwardRef(() => CustomerModule),
    forwardRef(() => ContractModule),
  ],
  exports: [DeviceService],
})
export class DeviceModule {}
