import { ConfigService } from '@nestjs/config';

export function jwtModuleOptions(configService: ConfigService) {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return {
    secret,
    signOptions: {
      expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES') || '1h',
    },
  };
}
