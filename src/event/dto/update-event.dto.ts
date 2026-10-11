import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';
import { EventStatus } from '../entities/event.entity';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  participants?: Types.ObjectId[];

  @IsOptional()
  @IsMongoId()
  organizer?: string;
}
