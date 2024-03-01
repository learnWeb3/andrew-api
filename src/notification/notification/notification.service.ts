import { MqttService } from './../../mqtt/mqtt/mqtt.service';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { MailerService } from '../mailer/mailer.service';
import { CreateNotificationDto } from 'src/lib/dto/create-notification.dto';
import { Notification, NotificationDocument } from './notification.schemas';
import { NotificationType } from 'src/lib/interfaces/notification-type.enum';
import { PickEnum } from 'src/lib/interfaces/pick-enum.type';
import { CustomerService } from 'src/customer/customer/customer.service';
import { KeycloakAvailableRoles } from 'src/keycloak/keycloak/keycloak-auth.guard';
import {
  PaginatedResults,
  Pagination,
} from 'src/lib/decorators/pagination.decorator';
import { SortFilters } from 'src/lib/decorators/sort-filters.decorators';
import { paginateMongooseQuery } from 'src/lib/helpers/paginate-mongoose-query.helper';
import { CustomerDocument } from 'src/customer/customer/customer.schemas';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @Inject(MailerService)
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => MqttService))
    private readonly mqttService: MqttService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
  ) {}

  findAll(
    filters: FilterQuery<Notification>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<
    PaginatedResults<NotificationDocument & { sender: CustomerDocument }>
  > {
    return paginateMongooseQuery<Notification, { sender: CustomerDocument }>(
      this.notificationModel,
      filters,
      pagination,
      sortFilters,
      ['sender'],
    );
  }

  async createAdminNotification(
    createNotificationDto: CreateNotificationDto & {
      type: PickEnum<
        NotificationType,
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PENDING
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CANCELED
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CONFIRMED
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_PENDING
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_REJECTED
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_REVIEWING
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_TO_AMMEND
      >;
    },
  ): Promise<{ _id: string }> {
    let newNotification = new this.notificationModel({
      ...createNotificationDto,
      accessibleBy: KeycloakAvailableRoles.SUPERADMIN,
    });
    newNotification = await newNotification.save();
    this.mqttService.emitAdminNotification({
      type: createNotificationDto.type,
    });
    return { _id: newNotification._id };
  }

  async createSupervisorNotification(
    createNotificationDto: CreateNotificationDto & {
      type: PickEnum<
        NotificationType,
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PENDING
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CANCELED
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CONFIRMED
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_REVIEWING
      >;
    },
  ): Promise<{ _id: string }> {
    let newNotification = new this.notificationModel({
      ...createNotificationDto,
      accessibleBy: KeycloakAvailableRoles.INSURER,
    });
    newNotification = await newNotification.save();
    this.mqttService.emitSupervisorNotification({
      type: createNotificationDto.type,
    });
    return { _id: newNotification._id };
  }

  async createCustomerNotification(
    createNotificationDto: CreateNotificationDto & {
      type: PickEnum<
        NotificationType,
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CANCELED
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CONFIRMED
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_PENDING
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_REJECTED
        | NotificationType.SUBSCRIPTION_APPLICATION_STATUS_TO_AMMEND
      >;
    },
  ): Promise<{ _id: string }> {
    let newNotification = new this.notificationModel({
      ...createNotificationDto,
      accessibleBy: KeycloakAvailableRoles.USER,
    });
    newNotification = await newNotification.save();
    const customerIds = [];
    const oauthReveivers: string[] = await this.customerService
      .findAll(
        {
          _id: { $in: customerIds },
        },
        { start: 0, limit: Number.MAX_SAFE_INTEGER },
        {
          sort: 'createdAt',
          order: -1,
        },
      )
      .then((paginatedResults) =>
        paginatedResults.results.map(
          (customer) => customer.authorizationServerUserId,
        ),
      );
    for (const oauthReceiver of oauthReveivers) {
      this.mqttService.emitCustomerNotification(oauthReceiver, {
        type: createNotificationDto.type,
      });
    }
    return { _id: newNotification._id };
  }
}
