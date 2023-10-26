import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { Device } from './device.schemas';

export type DataTransmissionDocument = HydratedDocument<DataTransmission>;

@Schema({
  timestamps: true,
})
export class DataTransmission {
  @Prop({
    type: mongoose.Schema.Types.String,
    default: function genUUID() {
      return uuid();
    },
  })
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    ref: Device.name,
  })
  device: string;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
  })
  metadata: any;
}

export const DataTransmissionSchema =
  SchemaFactory.createForClass(DataTransmission);
