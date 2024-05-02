import { Module, forwardRef } from '@nestjs/common';
import { KafkaConsumerService } from './kafka-consumer/kafka-consumer.service';
import { OpensearchModule } from 'src/opensearch/opensearch.module';
import { DeviceSessionModule } from 'src/device-session/device-session.module';
import { DrivingSessionModule } from 'src/driving-session/driving-session.module';
import { DeviceModule } from 'src/device/device.module';
import { SubscriptionApplicationModule } from 'src/subscription-application/subscription-application.module';
import { ContractModule } from 'src/contract/contract.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  providers: [KafkaConsumerService],
  imports: [
    forwardRef(() => OpensearchModule),
    forwardRef(() => DeviceSessionModule),
    forwardRef(() => DrivingSessionModule),
    forwardRef(() => DeviceModule),
    forwardRef(() => SubscriptionApplicationModule),
    forwardRef(() => ContractModule),
    forwardRef(() => NotificationModule),
  ],
})
export class KafkaConsumerModule {}
