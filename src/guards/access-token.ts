import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { TokenType } from '../common/token-type';
import { User } from '../user/entities/user.entity';

export function extractBearerToken(request: {
  headers?: { authorization?: string };
}): string | undefined {
  const [type, token] = request.headers?.authorization?.split(' ') ?? [];
  return type === 'Bearer' && token ? token : undefined;
}

export async function authenticateAccessToken(
  request: { headers?: { authorization?: string }; user?: User },
  jwtService: JwtService,
  userModel: Model<User>,
): Promise<User> {
  const token = extractBearerToken(request);
  if (!token) {
    throw new UnauthorizedException('No token provided');
  }

  try {
    const payload = await jwtService.verifyAsync(token);
    if (payload?.type !== TokenType.ACCESS) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await userModel.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = user;
    return user;
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    throw new UnauthorizedException('Invalid token');
  }
}
