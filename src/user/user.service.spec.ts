import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;

  const mockUserModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
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
    userModel = module.get<Model<User>>(getModelToken(User.name));
    jest.clearAllMocks();
  });

  // describe('create', () => {
  //   it('should create a new user', async () => {
  //     const createUserDto: CreateUserDto = {
  //       email: 'test@test.com',
  //       password: 'password123',
  //       firstName: 'Test',
  //       lastName: 'User',
  //     };

  //     const expectedUser = {
  //       _id: 'someId',
  //       ...createUserDto,
  //     };

  //     mockUserModel.create.mockResolvedValue(expectedUser);

  //     const result = await service.create(createUserDto);

  //     expect(result).toEqual(expectedUser);
  //     expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
  //   });
  // });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [
        { _id: '1', email: 'test1@test.com' },
        { _id: '2', email: 'test2@test.com' },
      ];

      mockUserModel.find.mockResolvedValue(expectedUsers);

      const result = await service.findAll();

      expect(result).toEqual(expectedUsers);
      expect(mockUserModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const userId = '1';
      const expectedUser = {
        _id: userId,
        email: 'test@test.com',
      };

      mockUserModel.findById.mockResolvedValue(expectedUser);

      const result = await service.findOne(userId);

      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
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

      mockUserModel.findByIdAndUpdate.mockResolvedValue(expectedUser);

      const result = await service.update(userId, updateUserDto);

      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        { new: true },
      );
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const userId = '1';
      const expectedUser = {
        _id: userId,
        email: 'test@test.com',
      };

      mockUserModel.findByIdAndDelete.mockResolvedValue(expectedUser);

      const result = await service.remove(userId);

      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
    });
  });
});
