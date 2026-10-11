import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { TokenType } from '../common/token-type';
import { User } from '../user/entities/user.entity';
import { authenticateAccessToken } from './access-token';

describe('authenticateAccessToken', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const userModel = {
    findById: jest.fn(),
  } as unknown as Model<User>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when the Authorization header is missing', async () => {
    await expect(
      authenticateAccessToken({ headers: {} }, jwtService, userModel),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns 401 when the header is not a Bearer token', async () => {
    await expect(
      authenticateAccessToken(
        { headers: { authorization: 'Token abc' } },
        jwtService,
        userModel,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns 401 for a password-reset token', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      id: 'user-1',
      type: TokenType.RESET,
    });

    await expect(
      authenticateAccessToken(
        { headers: { authorization: 'Bearer reset-token' } },
        jwtService,
        userModel,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(userModel.findById).not.toHaveBeenCalled();
  });

  it('returns 401 when the token cannot be verified', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('bad'));

    await expect(
      authenticateAccessToken(
        { headers: { authorization: 'Bearer bad-token' } },
        jwtService,
        userModel,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
