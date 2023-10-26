import { Module, forwardRef } from '@nestjs/common';
import { ContractService } from './contract/contract.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Contract, ContractSchema } from './contract/contract.schemas';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { DeviceModule } from 'src/device/device.module';
import { ObjectStorageModule } from 'src/object-storage/object-storage.module';
import { EcommerceModule } from 'src/ecommerce/ecommerce.module';
import { OpensearchModule } from 'src/opensearch/opensearch.module';

@Module({
  providers: [ContractService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Contract.name,
        schema: ContractSchema,
      },
    ]),
    forwardRef(() => VehicleModule),
    forwardRef(() => DeviceModule),
    forwardRef(() => ObjectStorageModule),
    forwardRef(() => EcommerceModule),
    forwardRef(() => OpensearchModule),
  ],
  exports: [ContractService],
})
export class ContractModule {}
