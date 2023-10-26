import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { Device } from './device.schemas';

export type DataScoringDocument = HydratedDocument<DataScoring>;

@Schema({
  timestamps: true,
})
export class DataScoring {
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
    type: mongoose.Schema.Types.String,
  })
  driverBehaviourClass: string;
}

export const DataScoringSchema = SchemaFactory.createForClass(DataScoring);
