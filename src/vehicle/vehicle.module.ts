import { Module, forwardRef } from '@nestjs/common';
import { VehicleService } from './vehicle/vehicle.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from './vehicle/vehicle.schema';
import { ContractModule } from 'src/contract/contract.module';
import { DeviceModule } from 'src/device/device.module';
import { OpensearchModule } from 'src/opensearch/opensearch.module';
import { ObjectStorageModule } from 'src/object-storage/object-storage.module';

@Module({
  providers: [VehicleService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Vehicle.name,
        schema: VehicleSchema,
      },
    ]),
    forwardRef(() => ContractModule),
    forwardRef(() => DeviceModule),
    forwardRef(() => OpensearchModule),
    forwardRef(() => ObjectStorageModule),
  ],
  exports: [VehicleService],
})
export class VehicleModule {}
