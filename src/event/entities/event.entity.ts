import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EventStatus {
  SCHEDULED = 'scheduled',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: String, enum: EventStatus, default: EventStatus.SCHEDULED })
  status: EventStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  organizer: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  participants: Types.ObjectId[];
}

export const EventSchema = SchemaFactory.createForClass(Event);
