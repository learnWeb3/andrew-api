import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';

export type DrivingSessionDocument = HydratedDocument<DrivingSession>;

@Schema({})
export class DrivingSession {
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
  device: string;

  @Prop({
    type: mongoose.Schema.Types.Date,
  })
  start: Date;

  @Prop({
    type: mongoose.Schema.Types.Date,
    default: null,
  })
  end: Date;
}

const DrivingSessionSchema = SchemaFactory.createForClass(DrivingSession);

DrivingSessionSchema.index(
  {
    device: 1,
    end: 1,
  },
  { sparse: true, unique: true },
);

export { DrivingSessionSchema };
