import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getModelToken } from '@nestjs/mongoose';
import { Event, EventStatus } from './entities/event.entity';
import { Types } from 'mongoose';
import { User } from '../user/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

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
      expect(mockQuery.populate).toHaveBeenCalledWith('organizer');
      expect(mockQuery.populate).toHaveBeenCalledWith('participants');
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      const result = await service.findOne(mockEvent._id.toString());
      expect(result).toEqual(mockEvent);
      expect(mockEventModel.findById).toHaveBeenCalledWith(
        mockEvent._id.toString(),
      );
      expect(mockQuery.populate).toHaveBeenCalledWith('organizer');
      expect(mockQuery.populate).toHaveBeenCalledWith('participants');
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

    it('should successfully update an event', async () => {
      const updatedEvent = { ...mockEvent, ...updateEventDto };
      mockQuery.exec.mockResolvedValueOnce(updatedEvent);

      const result = await service.update(
        mockEvent._id.toString(),
        updateEventDto,
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
        service.update('nonexistentId', updateEventDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should successfully delete an event', async () => {
      mockQuery.exec.mockResolvedValueOnce({ isDeleted: true });

      const result = await service.remove(mockEvent._id.toString());
      expect(result.message).toBe('Event deleted successfully');
      expect(mockEventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id.toString(),
        { isDeleted: true },
      );
    });
  });
});
