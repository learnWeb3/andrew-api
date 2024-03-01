import { Global, Module, forwardRef } from '@nestjs/common';
import { CustomerService } from './customer/customer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './customer/customer.schemas';
import { ContractModule } from 'src/contract/contract.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { DeviceModule } from 'src/device/device.module';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { ObjectStorageModule } from 'src/object-storage/object-storage.module';
import { EcommerceModule } from 'src/ecommerce/ecommerce.module';
import { SubscriptionApplicationModule } from 'src/subscription-application/subscription-application.module';
import { NotificationModule } from 'src/notification/notification.module';

@Global()
@Module({
  providers: [CustomerService],
  exports: [CustomerService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
    forwardRef(() => ContractModule),
    forwardRef(() => VehicleModule),
    forwardRef(() => DeviceModule),
    forwardRef(() => KeycloakModule),
    forwardRef(() => ObjectStorageModule),
    forwardRef(() => EcommerceModule),
    forwardRef(() => SubscriptionApplicationModule),
    forwardRef(() => NotificationModule),
  ],
})
export class CustomerModule {}
