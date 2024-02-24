import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Contract } from 'src/contract/contract/contract.schemas';
import { Customer } from 'src/customer/customer/customer.schemas';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { SubscriptionApplicationStatus } from 'src/lib/interfaces/subscription-application-status.enum';
import { v4 as uuid } from 'uuid';

@Schema({
  timestamps: false,
  _id: false,
})
export class SubscriptionApplicationVehicle {
  @Prop({
    type: mongoose.Schema.Types.String,
  })
  vin: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  brand: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  model: string;

  @Prop({
    type: mongoose.Schema.Types.Number,
  })
  year: number;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  registrationNumber: string;

  @Prop({
    type: mongoose.Schema.Types.Date,
  })
  originalInServiceDate: Date;

  @Prop({
    type: mongoose.Schema.Types.Number,
  })
  contractSubscriptionKm: number;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  driverLicenceDocURL: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  vehicleRegistrationCardDocURL: string;
}

export type SubscriptionApplicationVehicleDocument =
  HydratedDocument<SubscriptionApplicationVehicle>;

export const SubscriptionApplicationVehicleSchema =
  SchemaFactory.createForClass(SubscriptionApplicationVehicle);

@Schema({
  timestamps: false,
  _id: false,
})
export class SubscriptionApplicationContract {
  @Prop({
    type: mongoose.Schema.Types.String,
  })
  contractDocURL: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  ecommerceProduct: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: EcommerceGateway,
  })
  ecommerceGateway: EcommerceGateway;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Contract.name,
  })
  contract?: string;
}

export type SubscriptionApplicationContractDocument =
  HydratedDocument<SubscriptionApplicationContract>;

export const SubscriptionApplicationContractSchema =
  SchemaFactory.createForClass(SubscriptionApplicationContract);

@Schema({
  timestamps: true,
  _id: false,
})
export class SubscriptionApplicationStatusHistoryItem {
  @Prop({
    type: mongoose.Schema.Types.String,
    enum: SubscriptionApplicationStatus,
    default: SubscriptionApplicationStatus.PENDING,
  })
  status: SubscriptionApplicationStatus;
  @Prop({
    type: mongoose.Schema.Types.String,
  })
  comment: string;
}

export type SubscriptionApplicationStatusHistoryItemDocument =
  HydratedDocument<SubscriptionApplicationStatusHistoryItem>;

export const SubscriptionApplicationStatusHistoryItemSchema =
  SchemaFactory.createForClass(SubscriptionApplicationStatusHistoryItem);

@Schema({
  timestamps: true,
})
export class SubscriptionApplication {
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
  })
  customer: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: SubscriptionApplicationStatus,
    default: SubscriptionApplicationStatus.PENDING,
  })
  status: SubscriptionApplicationStatus;

  @Prop({
    type: [SubscriptionApplicationStatusHistoryItemSchema],
    default: [],
  })
  statusHistory: SubscriptionApplicationStatusHistoryItem[];

  @Prop({
    type: [SubscriptionApplicationVehicleSchema],
  })
  vehicles: SubscriptionApplicationVehicle[];

  @Prop({
    type: SubscriptionApplicationContractSchema,
  })
  contract: SubscriptionApplicationContract;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  ref: string;
}

export type SubscriptionApplicationDocument =
  HydratedDocument<SubscriptionApplication>;

const SubscriptionApplicationSchema = SchemaFactory.createForClass(
  SubscriptionApplication,
);

SubscriptionApplicationSchema.index(
  {
    'vehciles.vin': 1,
  },
  { unique: true },
);

export { SubscriptionApplicationSchema };
