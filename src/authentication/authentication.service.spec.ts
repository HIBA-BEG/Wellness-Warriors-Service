import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../user/entities/user.entity';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let userModel: Model<User>;
  let jwtService: JwtService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const createAuthDto = {
      email: 'test@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      const savedUser = {
        _id: 'mockId',
        ...createAuthDto,
        password: 'hashedPassword',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await service.register(createAuthDto);

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock_token');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ 
        email: createAuthDto.email 
      });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        ...createAuthDto,
        password: expect.any(String),
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: savedUser._id,
        email: savedUser.email,
      });
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ id: 1 });

      await expect(service.register(createAuthDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const loginAuthDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      const mockUser = {
        _id: 'mockId',
        email: loginAuthDto.email,
        password: await bcrypt.hash(loginAuthDto.password, 10),
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await service.login(loginAuthDto);

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock_token');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ 
        email: loginAuthDto.email 
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: mockUser._id,
        email: mockUser.email,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginAuthDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = {
        _id: 'mockId',
        email: loginAuthDto.email,
        password: await bcrypt.hash('differentpassword', 10),
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginAuthDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});