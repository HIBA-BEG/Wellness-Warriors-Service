import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { CreateAuthenticationDto } from './dto/create-authentication.dto';
import { LoginAuthenticationDto } from './dto/login-authentication.dto';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  register(@Body() createAuthDto: CreateAuthenticationDto) {
    return this.authenticationService.register(createAuthDto);
  }

  @Post('login')
  login(@Body() loginAuthDto: LoginAuthenticationDto) {
    return this.authenticationService.login(loginAuthDto);
  }

  @Get('verify')
  verifyToken(@Headers('authorization') token: string) {
    const tokenValue = token.replace('Bearer ', '');
    return this.authenticationService.verifyToken(tokenValue);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authenticationService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: { token: string; password: string }) {
    return this.authenticationService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }
}
