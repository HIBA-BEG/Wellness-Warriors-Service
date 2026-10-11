import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, EventStatus } from './entities/event.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { FileUpload } from '../types/file-upload.interface';
import { savePublicImage } from '../common/image-upload';
import { storedAssetPath } from '../common/asset-url';
import { AuthActor } from '../user/user.service';

const PUBLIC_USER_FIELDS =
  'firstName lastName email profilePicture role gender';

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
    const poster = await this.uploadEventImage(file);
    const createdEvent = new this.eventModel({
      ...createEventDto,
      poster,
    });
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

  async uploadEventImage(file: FileUpload): Promise<string> {
    return savePublicImage(file, 'uploads');
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel
      .find({ isDeleted: false })
      .populate({ path: 'organizer', select: PUBLIC_USER_FIELDS })
      .populate({ path: 'participants', select: PUBLIC_USER_FIELDS })
      .exec();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .populate({ path: 'organizer', select: PUBLIC_USER_FIELDS })
      .populate({ path: 'participants', select: PUBLIC_USER_FIELDS })
      .exec();

    if (!event || event.isDeleted) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    actor: AuthActor,
  ): Promise<Event> {
    const existing = await this.eventModel.findById(id).exec();
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Event not found');
    }

    this.assertCanManage(existing, actor);

    const changes = { ...updateEventDto };
    delete changes.organizer;
    if (changes.poster) {
      changes.poster = storedAssetPath(changes.poster);
    }
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, changes, { new: true })
      .populate({ path: 'organizer', select: PUBLIC_USER_FIELDS })
      .populate({ path: 'participants', select: PUBLIC_USER_FIELDS })
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException('Event not found');
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

  async join(id: string, actor: AuthActor): Promise<Event> {
    const event = await this.findActiveEvent(id);
    this.assertCanAttend(event, actor);

    if (event.status !== EventStatus.SCHEDULED || event.endDate <= new Date()) {
      throw new BadRequestException('This event is not open for registration');
    }

    await this.eventModel.findByIdAndUpdate(id, {
      $addToSet: { participants: actor.id },
    });
    await this.userModel.findByIdAndUpdate(actor.id, {
      $addToSet: { attendingEvents: event._id },
    });

    return this.findOne(id);
  }

  async leave(id: string, actor: AuthActor): Promise<Event> {
    const event = await this.findActiveEvent(id);

    if (actor.role !== UserRole.PARTICIPANT) {
      throw new ForbiddenException('Only participants can change attendance');
    }

    if (event.status === EventStatus.COMPLETED) {
      throw new BadRequestException(
        'Attendance for a completed event stays on record',
      );
    }

    await this.eventModel.findByIdAndUpdate(id, {
      $pull: { participants: actor.id },
    });
    await this.userModel.findByIdAndUpdate(actor.id, {
      $pull: { attendingEvents: event._id },
    });

    return this.findOne(id);
  }

  async remove(id: string, actor: AuthActor): Promise<{ message: string }> {
    const existing = await this.eventModel.findById(id).exec();
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Event not found');
    }

    this.assertCanManage(existing, actor);

    await this.eventModel.findByIdAndUpdate(id, { isDeleted: true }).exec();

    return { message: 'Event deleted successfully' };
  }

  private async findActiveEvent(id: string): Promise<Event> {
    const event = await this.eventModel.findById(id).exec();
    if (!event || event.isDeleted) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  private assertCanAttend(event: Event, actor: AuthActor) {
    if (actor.role !== UserRole.PARTICIPANT) {
      throw new ForbiddenException('Only participants can join an event');
    }

    if (this.organizerId(event) === String(actor.id)) {
      throw new BadRequestException('The organizer is already hosting this event');
    }
  }

  private organizerId(event: Event) {
    const organizer = event.organizer as unknown as {
      _id?: { toString(): string };
      toString(): string;
    };
    return organizer?._id ? organizer._id.toString() : organizer?.toString();
  }

  private assertCanManage(event: Event, actor: AuthActor) {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (this.organizerId(event) === String(actor.id)) {
      return;
    }

    throw new ForbiddenException(
      'Only the event organizer or an admin can modify this event',
    );
  }
}
