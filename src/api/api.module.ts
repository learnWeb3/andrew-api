import { Module, forwardRef } from '@nestjs/common';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { ContractController } from './contract/contract.controller';
import { CustomerController } from './customer/customer.controller';
import { VehicleController } from './vehicle/vehicle.controller';
import { DeviceController } from './device/device.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Contract,
  ContractSchema,
} from 'src/contract/contract/contract.schemas';
import {
  Customer,
  CustomerSchema,
} from 'src/customer/customer/customer.schemas';
import { Vehicle, VehicleSchema } from 'src/vehicle/vehicle/vehicle.schema';
import { Device, DeviceSchema } from 'src/device/device/device.schemas';
import { ContractModule } from 'src/contract/contract.module';
import { CustomerModule } from 'src/customer/customer.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { DeviceModule } from 'src/device/device.module';
import { ObjectStorageController } from './object-storage/object-storage.controller';
import { ObjectStorageModule } from 'src/object-storage/object-storage.module';
import { SubscriptionApplicationController } from './subscription-application/subscription-application.controller';
import {
  SubscriptionApplication,
  SubscriptionApplicationSchema,
} from 'src/subscription-application/subscription-application/subscription-application.schemas';
import { SubscriptionApplicationModule } from 'src/subscription-application/subscription-application.module';
import { EcommerceModule } from 'src/ecommerce/ecommerce.module';

@Module({
  imports: [
    forwardRef(() => KeycloakModule),
    MongooseModule.forFeature([
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
      {
        name: Contract.name,
        schema: ContractSchema,
      },
      {
        name: Vehicle.name,
        schema: VehicleSchema,
      },
      {
        name: Device.name,
        schema: DeviceSchema,
      },
      {
        name: SubscriptionApplication.name,
        schema: SubscriptionApplicationSchema,
      },
    ]),
    forwardRef(() => ContractModule),
    forwardRef(() => CustomerModule),
    forwardRef(() => VehicleModule),
    forwardRef(() => DeviceModule),
    forwardRef(() => ObjectStorageModule),
    forwardRef(() => EcommerceModule),
    forwardRef(() => SubscriptionApplicationModule),
  ],
  controllers: [
    ContractController,
    CustomerController,
    VehicleController,
    DeviceController,
    ObjectStorageController,
    SubscriptionApplicationController,
  ],
})
export class ApiModule {}
