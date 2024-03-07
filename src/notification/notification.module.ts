import { Module, forwardRef } from '@nestjs/common';
import { MailerService } from './mailer/mailer.service';
import { NotificationService } from './notification/notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from './notification/notification.schemas';
import { CustomerModule } from 'src/customer/customer.module';

@Module({
  providers: [MailerService, NotificationService],
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    forwardRef(() => CustomerModule),
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
