import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Customer } from 'src/customer/customer/customer.schemas';
import { KeycloakAvailableRoles } from 'src/keycloak/keycloak/keycloak-auth.guard';
import { NotificationType } from 'src/lib/interfaces/notification-type.enum';
import { v4 as uuid } from 'uuid';

// NOTIFICATION

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
})
export class Notification {
  @Prop({
    type: mongoose.Schema.Types.String,
    default: function genUUID() {
      return uuid();
    },
  })
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Customer.name,
    default: null,
  })
  sender: string;

  @Prop({
    type: [mongoose.Schema.Types.String],
    ref: Customer.name,
    default: [],
  })
  receivers: string[];

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: NotificationType,
  })
  type: NotificationType;

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: KeycloakAvailableRoles,
  })
  accessibleBy: KeycloakAvailableRoles;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
  })
  data: any;
}

const NotificationSchema = SchemaFactory.createForClass(Notification);

export { NotificationSchema };
