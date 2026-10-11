import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../user/entities/user.entity';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcryptjs';
import { FileUpload } from '../types/file-upload.interface';
import { TokenType } from '../common/token-type';
import { UserRole } from '../user/entities/user.entity';

describe('AuthenticationService', () => {
  let service: AuthenticationService;

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockFile: FileUpload = {
    buffer: Buffer.from('mock image data'),
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
  };

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

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

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    const createAuthDto = {
      email: 'test@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'organizer',
      gender: 'woman',
    };

    it('should successfully register a new user', async () => {
      const savedUser = {
        _id: 'mockId',
        email: createAuthDto.email,
        role: UserRole.PARTICIPANT,
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await service.register(createAuthDto, mockFile);

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock_token');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: createAuthDto.email,
      });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        firstName: createAuthDto.firstName,
        lastName: createAuthDto.lastName,
        email: createAuthDto.email,
        gender: createAuthDto.gender,
        password: expect.any(String),
        profilePicture: expect.any(String),
        role: UserRole.PARTICIPANT,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          id: savedUser._id,
          email: savedUser.email,
          role: UserRole.PARTICIPANT,
          type: TokenType.ACCESS,
        },
        { expiresIn: '1h' },
      );
    });

    it('forces the participant role even when the request asks for organizer', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({
        _id: 'mockId',
        email: createAuthDto.email,
        role: UserRole.PARTICIPANT,
      });
      mockJwtService.sign.mockReturnValue('mock_token');

      await service.register(
        { ...createAuthDto, role: UserRole.ORGANIZER },
        mockFile,
      );

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.PARTICIPANT }),
      );
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ id: 1 });

      await expect(service.register(createAuthDto, mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const loginAuthDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    const mockLoginQuery = (user: unknown) => {
      const select = jest.fn().mockResolvedValue(user);
      mockUserModel.findOne.mockReturnValue({ select });
      return select;
    };

    it('should successfully login a user', async () => {
      const mockUser = {
        _id: 'mockId',
        email: loginAuthDto.email,
        role: UserRole.PARTICIPANT,
        password: await bcrypt.hash(loginAuthDto.password, 10),
      };

      const select = mockLoginQuery(mockUser);
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await service.login(loginAuthDto);

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock_token');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: loginAuthDto.email,
      });
      expect(select).toHaveBeenCalledWith('+password');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          id: mockUser._id,
          email: mockUser.email,
          role: mockUser.role,
          type: TokenType.ACCESS,
        },
        { expiresIn: '1h' },
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockLoginQuery(null);

      await expect(service.login(loginAuthDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockLoginQuery({
        _id: 'mockId',
        email: loginAuthDto.email,
        password: await bcrypt.hash('differentpassword', 10),
      });

      await expect(service.login(loginAuthDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('token purpose', () => {
    it('rejects an access token used to reset a password', async () => {
      mockJwtService.verify.mockReturnValue({
        id: 'user-1',
        email: 'test@test.com',
        type: TokenType.ACCESS,
      });

      await expect(
        service.resetPassword('access-token', 'newpassword1'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });

    it('rejects a reset token used as a session token', async () => {
      mockJwtService.verify.mockReturnValue({
        id: 'user-1',
        email: 'test@test.com',
        type: TokenType.RESET,
      });

      await expect(service.verifyToken('reset-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('signs reset tokens with their own expiry', async () => {
      process.env.JWT_RESET_EXPIRES = '30m';
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'mailer@example.com';
      process.env.SMTP_PASS = 'secret';
      mockUserModel.findOne.mockResolvedValue({
        _id: 'user-1',
        email: 'test@test.com',
        tokenVersion: 0,
      });
      mockJwtService.sign.mockReturnValue('reset-token');
      mockMailerService.sendMail.mockResolvedValue({});

      await service.forgotPassword('test@test.com');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ type: TokenType.RESET }),
        expect.objectContaining({ expiresIn: '30m' }),
      );
    });
  });
});
