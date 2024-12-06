import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  ORGANIZER = 'organizer',
  PARTICIPANT = 'participant',
}

export enum UserGender {
  Man = 'man',
  Woman = 'woman',
}
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.PARTICIPANT })
  role: UserRole;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ type: String, enum: UserGender })
  gender: UserGender;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Event' }] })
  attendingEvents: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Event' }] })
  createdEvents: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
