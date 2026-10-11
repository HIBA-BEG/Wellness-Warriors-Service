import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FastifyRequest } from 'fastify';
import { AuthenticationService } from './authentication.service';
import { LoginAuthenticationDto } from './dto/login-authentication.dto';
import { RegisterAuthenticationDto } from './dto/register-authentication.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { assertValid, readMultipart } from '../common/multipart';

@Controller('auth')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  async register(@Req() request: FastifyRequest) {
    const { fields, file } = await readMultipart(request);
    const createAuthDto = await assertValid(RegisterAuthenticationDto, {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      password: fields.password,
      gender: fields.genre || fields.gender,
      role: fields.role,
    });

    return this.authenticationService.register(createAuthDto, file);
  }

  @Post('login')
  login(@Body() loginAuthDto: LoginAuthenticationDto) {
    return this.authenticationService.login(loginAuthDto);
  }

  @Get('verify')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  verifyToken(@Headers('authorization') authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return this.authenticationService.verifyToken(token);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authenticationService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authenticationService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }
}
