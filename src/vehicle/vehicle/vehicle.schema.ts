import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Contract } from 'src/contract/contract/contract.schemas';
import { Customer } from 'src/customer/customer/customer.schemas';
import { v4 as uuid } from 'uuid';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({
  timestamps: true,
})
export class Vehicle {
  @Prop({
    type: mongoose.Schema.Types.String,
    default: function genUUID() {
      return uuid();
    },
  })
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Contract.name,
  })
  contract: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Customer.name,
  })
  customer: string;

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

  @Prop({
    type: mongoose.Schema.Types.Number,
  })
  drivingTimeHours: number;
}

const VehicleSchema = SchemaFactory.createForClass(Vehicle);

VehicleSchema.index({ vin: 1 }, { unique: true });

export { VehicleSchema };
