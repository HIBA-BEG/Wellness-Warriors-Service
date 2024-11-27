import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let service: AuthenticationService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
    service = module.get<AuthenticationService>(AuthenticationService);
  });

  describe('register', () => {
    it('should call service.register with correct data', async () => {
      const createAuthDto = {
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const expectedResponse = { token: 'mock_token' };
      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(createAuthDto);

      expect(service.register).toHaveBeenCalledWith(createAuthDto);
      expect(result).toBe(expectedResponse);
    });
  });

  describe('login', () => {
    it('should call service.login with correct data', async () => {
      const loginAuthDto = {
        email: 'test@test.com',
        password: 'password123',
      };
      const expectedResponse = { token: 'mock_token' };
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginAuthDto);

      expect(service.login).toHaveBeenCalledWith(loginAuthDto);
      expect(result).toBe(expectedResponse);
    });
  });
});