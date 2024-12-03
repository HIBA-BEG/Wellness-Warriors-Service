import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const createdEvent = new this.eventModel(createEventDto);
    const event = await createdEvent.save();

    await this.userModel.findByIdAndUpdate(event.organizer, {
      $push: { createdEvents: event._id },
    });

    await this.userModel.updateMany(
      { _id: { $in: event.participants } },
      { $push: { attendingEvents: event._id } },
    );

    return event;
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
