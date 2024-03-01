import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionApplicationService } from './subscription-application/subscription-application.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SubscriptionApplication,
  SubscriptionApplicationSchema,
} from './subscription-application/subscription-application.schemas';
import { CustomerModule } from 'src/customer/customer.module';
import { ContractModule } from 'src/contract/contract.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { EcommerceModule } from 'src/ecommerce/ecommerce.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SubscriptionApplication.name,
        schema: SubscriptionApplicationSchema,
      },
    ]),
    forwardRef(() => CustomerModule),
    forwardRef(() => ContractModule),
    forwardRef(() => VehicleModule),
    forwardRef(() => EcommerceModule),
    forwardRef(() => NotificationModule),
  ],
  providers: [SubscriptionApplicationService],
  exports: [SubscriptionApplicationService],
})
export class SubscriptionApplicationModule {}
