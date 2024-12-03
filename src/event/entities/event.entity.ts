import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export enum EventStatus {
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
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

  @Prop({ required: true })
  location: string;

  @Prop()
  poster: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: String, enum: EventStatus, default: EventStatus.SCHEDULED })
  status: EventStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  organizer: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  participants: User[];
}

export const EventSchema = SchemaFactory.createForClass(Event);
