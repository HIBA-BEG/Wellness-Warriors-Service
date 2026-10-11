import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForbiddenException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;

  const select = jest.fn();
  const updateSelect = jest.fn();

  const mockUserModel = {
    find: jest.fn(() => ({ select })),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(() => ({ select: updateSelect })),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [
        { _id: '1', email: 'test1@test.com' },
        { _id: '2', email: 'test2@test.com' },
      ];

      select.mockResolvedValue(expectedUsers);

      const result = await service.findAll();

      expect(result).toEqual(expectedUsers);
      expect(mockUserModel.find).toHaveBeenCalledWith({ role: 'participant' });
      expect(select).toHaveBeenCalledWith('-password');
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const userId = '1';
      const expectedUser = {
        _id: userId,
        email: 'test@test.com',
      };
      const findSelect = jest.fn().mockResolvedValue(expectedUser);
      mockUserModel.findById.mockReturnValue({ select: findSelect });

      const result = await service.findOne(userId);

      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(findSelect).toHaveBeenCalledWith('-password');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      };

      const expectedUser = {
        _id: userId,
        ...updateUserDto,
      };

      mockUserModel.findById.mockImplementation((id) => {
        if (id === 'organizer-1') {
          return Promise.resolve({
            _id: id,
            role: 'organizer',
            createdEvents: ['event-1'],
          });
        }

        return Promise.resolve({
          _id: id,
          role: 'participant',
          attendingEvents: ['event-1'],
        });
      });
      updateSelect.mockResolvedValue(expectedUser);

      const result = await service.update(userId, updateUserDto, {
        id: 'organizer-1',
        role: 'organizer',
      });

      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        { new: true },
      );
    });

    it('lets a user update their own account', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: '1',
        role: 'participant',
      });
      updateSelect.mockResolvedValue({ _id: '1', firstName: 'Mine' });

      await expect(
        service.update(
          '1',
          { firstName: 'Mine' },
          { id: '1', role: 'participant' },
        ),
      ).resolves.toEqual({ _id: '1', firstName: 'Mine' });
    });

    it('rejects updates to someone else account', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: '2',
        role: 'organizer',
      });

      await expect(
        service.update(
          '2',
          { firstName: 'Hijack' },
          { id: '1', role: 'participant' },
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const userId = '1';
      const expectedResult = { message: 'User deleted successfully' };

      mockUserModel.findById.mockImplementation((id) => {
        if (id === 'organizer-1') {
          return Promise.resolve({
            _id: id,
            role: 'organizer',
            createdEvents: ['event-1'],
          });
        }

        return Promise.resolve({
          _id: id,
          role: 'participant',
          attendingEvents: ['event-1'],
        });
      });
      mockUserModel.findByIdAndDelete.mockResolvedValue({
        _id: userId,
        email: 'test@test.com',
      });

      const result = await service.remove(userId, {
        id: 'organizer-1',
        role: 'organizer',
      });

      expect(result).toEqual(expectedResult);
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
    });
  });
});
