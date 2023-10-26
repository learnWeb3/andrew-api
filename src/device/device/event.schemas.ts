import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { Device } from './device.schemas';
import { EventCategory } from './event-category.enum';
import { EventLevel } from './event-level.enum';

export type EventDocument = HydratedDocument<Event>;

@Schema({
  timestamps: true,
})
export class Event {
  @Prop({
    type: mongoose.Schema.Types.String,
    default: function genUUID() {
      return uuid();
    },
  })
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.String,
    enum: EventCategory,
  })
  category: EventCategory;

  @Prop({
    type: mongoose.Schema.Types.Number,
    enum: EventLevel,
  })
  level: EventLevel;

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

export const EventSchema = SchemaFactory.createForClass(Event);
