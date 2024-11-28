import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Types } from 'mongoose';
import { EventStatus } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @IsString()
  @IsOptional()
  poster: string;

  @IsString()
  @IsOptional()
  status: EventStatus;

  @IsMongoId()
  @IsNotEmpty()
  organizer: Types.ObjectId;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  participants?: Types.ObjectId[];
}
