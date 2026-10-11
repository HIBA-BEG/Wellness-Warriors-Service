import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getModelToken } from '@nestjs/mongoose';
import { Event, EventStatus } from './entities/event.entity';
import { Types } from 'mongoose';
import { User } from '../user/entities/user.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('EventService', () => {
  let service: EventService;

  const mockEvent = {
    _id: new Types.ObjectId(),
    title: 'Semi Marathon',
    description: 'Join us for a semi marathon in Rabat!',
    startDate: new Date(),
    endDate: new Date(),
    location: 'Rabat, Morocco',
    poster: 'semiMarathon.jpg',
    status: EventStatus.SCHEDULED,
    organizer: new Types.ObjectId(),
    participants: [],
    save: jest.fn().mockResolvedValue(this),
  };

  const mockEvent2 = {
    _id: new Types.ObjectId(),
    title: 'Yalla Nejriw! Marathon in Casablanca',
    description: 'Join us for a marathon in Casablanca, Morocco! ',
    startDate: new Date(),
    endDate: new Date(),
    location: 'Casablanca, Morocco',
    poster: 'marathon.jpg',
    status: EventStatus.SCHEDULED,
  };

  const mockUserModel = {
    findById: jest.fn().mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }),
    })),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
  };

  const mockQuery = {
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(mockEvent),
  };

  const mockEventModel = {
    find: jest.fn().mockReturnValue(mockQuery),
    findById: jest.fn().mockReturnValue(mockQuery),
    findByIdAndUpdate: jest.fn().mockReturnValue(mockQuery),
    deleteOne: jest.fn().mockReturnValue(mockQuery),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    jest.clearAllMocks();

    mockQuery.exec.mockResolvedValue(mockEvent);
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      mockQuery.exec.mockResolvedValueOnce([mockEvent, mockEvent2]);

      const result = await service.findAll();
      expect(result).toEqual([mockEvent, mockEvent2]);
      expect(mockEventModel.find).toHaveBeenCalled();
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'organizer',
        select: 'firstName lastName email profilePicture role gender',
      });
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'participants',
        select: 'firstName lastName email profilePicture role gender',
      });
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      const result = await service.findOne(mockEvent._id.toString());
      expect(result).toEqual(mockEvent);
      expect(mockEventModel.findById).toHaveBeenCalledWith(
        mockEvent._id.toString(),
      );
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'organizer',
        select: 'firstName lastName email profilePicture role gender',
      });
      expect(mockQuery.populate).toHaveBeenCalledWith({
        path: 'participants',
        select: 'firstName lastName email profilePicture role gender',
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      mockQuery.exec.mockResolvedValueOnce(null);
      await expect(service.findOne('nonexistentId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateEventDto = {
      title: 'Updated Marathon',
    };

    const owner = {
      id: mockEvent.organizer.toString(),
      role: 'organizer',
    };

    it('should successfully update an event', async () => {
      const updatedEvent = { ...mockEvent, ...updateEventDto };
      mockQuery.exec
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(updatedEvent);

      const result = await service.update(
        mockEvent._id.toString(),
        updateEventDto,
        owner,
      );
      expect(result).toEqual(updatedEvent);
      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        updateEventDto,
        { new: true },
      );
    });

    it('should throw NotFoundException if event not found', async () => {
      mockQuery.exec.mockResolvedValueOnce(null);
      await expect(
        service.update('nonexistentId', updateEventDto, owner),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an organizer who does not own the event', async () => {
      mockQuery.exec.mockResolvedValueOnce(mockEvent);

      await expect(
        service.update(mockEvent._id.toString(), updateEventDto, {
          id: new Types.ObjectId().toString(),
          role: 'organizer',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockEventModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('allows an admin to update an event they do not own', async () => {
      const updatedEvent = { ...mockEvent, ...updateEventDto };
      mockQuery.exec
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(updatedEvent);

      await expect(
        service.update(mockEvent._id.toString(), updateEventDto, {
          id: new Types.ObjectId().toString(),
          role: 'admin',
        }),
      ).resolves.toEqual(updatedEvent);
    });

    it('does not let the request body change the organizer', async () => {
      mockQuery.exec
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(mockEvent);

      await service.update(
        mockEvent._id.toString(),
        { ...updateEventDto, organizer: new Types.ObjectId().toString() },
        owner,
      );

      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        updateEventDto,
        { new: true },
      );
    });
  });

  describe('remove', () => {
    it('should successfully delete an event', async () => {
      mockQuery.exec.mockResolvedValueOnce(mockEvent);

      const result = await service.remove(mockEvent._id.toString(), {
        id: mockEvent.organizer.toString(),
        role: 'organizer',
      });
      expect(result.message).toBe('Event deleted successfully');
      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        { isDeleted: true },
      );
    });

    it('rejects deletion by a different organizer', async () => {
      mockQuery.exec.mockResolvedValueOnce(mockEvent);

      await expect(
        service.remove(mockEvent._id.toString(), {
          id: new Types.ObjectId().toString(),
          role: 'organizer',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('join', () => {
    const openEvent = {
      ...mockEvent,
      status: EventStatus.SCHEDULED,
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    it('adds a participant to a scheduled event', async () => {
      const participantId = new Types.ObjectId().toString();
      const joined = { ...openEvent, participants: [participantId] };
      mockQuery.exec
        .mockResolvedValueOnce(openEvent)
        .mockResolvedValueOnce(joined);

      const result = await service.join(openEvent._id.toString(), {
        id: participantId,
        role: 'participant',
      });

      expect(result).toEqual(joined);
      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        openEvent._id.toString(),
        { $addToSet: { participants: participantId } },
      );
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        participantId,
        {
          $addToSet: { attendingEvents: openEvent._id },
        },
      );
    });

    it('rejects an organizer joining an event', async () => {
      mockQuery.exec.mockResolvedValueOnce(openEvent);

      await expect(
        service.join(openEvent._id.toString(), {
          id: new Types.ObjectId().toString(),
          role: 'organizer',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a cancelled event', async () => {
      mockQuery.exec.mockResolvedValueOnce({
        ...openEvent,
        status: EventStatus.CANCELLED,
      });

      await expect(
        service.join(openEvent._id.toString(), {
          id: new Types.ObjectId().toString(),
          role: 'participant',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
