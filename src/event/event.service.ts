import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { User } from '../user/entities/user.entity';
import { join, extname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { FileUpload } from '../types/file-upload.interface';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    file: FileUpload,
  ): Promise<Event> {
    try {
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('Invalid file buffer');
      }

      const imageUrl = await this.uploadEventImage(file);

      const eventData = {
        ...createEventDto,
        poster: imageUrl,
      };
      const createdEvent = new this.eventModel(eventData);
      const event = await createdEvent.save();

      await this.userModel.findByIdAndUpdate(event.organizer, {
        $push: { createdEvents: event._id },
      });

      await this.userModel.updateMany(
        { _id: { $in: event.participants } },
        { $push: { attendingEvents: event._id } },
      );

      return event;
    } catch (error) {
      // console.error('Service error details:', {
      //   message: error.message,
      //   name: error.name
      // });
      throw new BadRequestException(`Failed to create event: ${error.message}`);
    }
  }

  async uploadEventImage(file: FileUpload): Promise<string> {
    try {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Only JPEG, PNG, and GIF are allowed.',
        );
      }

      const uploadDir = join(process.cwd(), 'uploads');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        if (err.code !== 'EEXIST') throw err;
      }
      // console.log('Service: Upload directory verified:', uploadDir);

      const fileExt = extname(file.originalname || '.jpg');
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = join(uploadDir, fileName);

      // console.log('Service: Writing file:', {
      //   path: filePath,
      //   size: file.buffer.length
      // });

      await writeFile(filePath, file.buffer);
      console.log('Service: File written successfully:', filePath);
      const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
      return `${serverUrl}/uploads/${fileName}`;
    } catch (error) {
      // console.error('Upload error details:', {
      //   message: error.message,
      //   stack: error.stack,
      //   name: error.name
      // });
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel
      .find({ isDeleted: false })
      .populate('organizer')
      .populate('participants')
      .exec();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .populate('organizer')
      .populate('participants')
      .exec();

    if (!event) {
      throw new NotFoundException(`Event not found`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .populate('organizer')
      .populate('participants')
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Event not found`);
    }

    await this.userModel.findByIdAndUpdate(updatedEvent.organizer, {
      $addToSet: { createdEvents: updatedEvent._id },
    });

    await this.userModel.updateMany(
      { attendingEvents: updatedEvent._id },
      { $pull: { attendingEvents: updatedEvent._id } },
    );

    await this.userModel.updateMany(
      { _id: { $in: updatedEvent.participants } },
      { $addToSet: { attendingEvents: updatedEvent._id } },
    );

    return updatedEvent;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.eventModel
      .findByIdAndUpdate(id, { isDeleted: true })
      .exec();
    if (!result) {
      throw new NotFoundException(`Event not found`);
    }
    return { message: 'Event deleted successfully' };
  }
}
