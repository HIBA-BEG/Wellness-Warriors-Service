import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { CreateAuthenticationDto } from './dto/create-authentication.dto';
import { LoginAuthenticationDto } from './dto/login-authentication.dto';
import { FastifyRequest } from 'fastify';
import { FileUpload } from 'src/types/file-upload.interface';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  async register(@Req() request: FastifyRequest) {
    const data = await request.file();

    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    const getFieldValue = (field: any): string => {
      if (!field) return '';
      if (Array.isArray(field)) return field[0].value;
      return field.value;
    };

    const createAuthDto: CreateAuthenticationDto = {
      firstName: getFieldValue(data.fields.firstName),
      lastName: getFieldValue(data.fields.lastName),
      email: getFieldValue(data.fields.email),
      password: getFieldValue(data.fields.password),
      role: getFieldValue(data.fields.role),
      gender: getFieldValue(data.fields.genre),
    };

    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const fileUpload: FileUpload = {
      buffer,
      originalname: data.filename,
      mimetype: data.mimetype,
    };

    return await this.authenticationService.register(createAuthDto, fileUpload);
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
