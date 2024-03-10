import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Contract } from 'src/contract/contract/contract.schemas';
import { Customer } from 'src/customer/customer/customer.schemas';
import { DeviceStatus } from 'src/lib/interfaces/device-status.enum';
import { Vehicle } from 'src/vehicle/vehicle/vehicle.schema';
import { v4 as uuid } from 'uuid';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({
  timestamps: true,
})
export class Device {
  @Prop({
    type: mongoose.Schema.Types.String,
    default: function genUUID() {
      return uuid();
    },
  })
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  ref: string;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  authorizationServerClientId: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: DeviceStatus,
    default: DeviceStatus.INACTIVE,
  })
  status: DeviceStatus;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Customer.name,
  })
  customer: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Vehicle.name,
  })
  vehicle: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Contract.name,
  })
  contract: string;

  @Prop({
    type: mongoose.Schema.Types.Date,
    default: null,
  })
  pairingDate: Date;

  @Prop({
    type: mongoose.Schema.Types.String,
  })
  serialNumber: string;
}

const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index(
  {
    serialNumber: 1,
  },
  { unique: true },
);

DeviceSchema.index({
  serialNumber: 1,
});

export { DeviceSchema };
