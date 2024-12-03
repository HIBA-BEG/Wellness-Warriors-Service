import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthenticationDto } from './dto/create-authentication.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '@nestjs-modules/mailer';
import { LoginAuthenticationDto } from './dto/login-authentication.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async register(
    createAuthDto: CreateAuthenticationDto,
  ): Promise<{ token: string }> {
    const existingUser = await this.userModel.findOne({
      email: createAuthDto.email,
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);

    const user = await this.userModel.create({
      ...createAuthDto,
      password: hashedPassword,
    });

    const token = this.jwtService.sign({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return { token };
  }

  async login(
    loginAuthDto: LoginAuthenticationDto,
  ): Promise<{ token: string }> {
    try {
      const user = await this.userModel.findOne({ email: loginAuthDto.email });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(
        loginAuthDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign({
        id: user._id,
        email: user.email,
      });

      return { token };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.userModel
        .findOne({ email: decoded.email })
        .select('-password');

      if (!user) throw new UnauthorizedException('User not found');

      return {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      console.error('Verify token error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{ email: string }> {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new UnauthorizedException('User with this email does not exist');
      }

      const resetToken = this.jwtService.sign(
        { id: user._id, email: user.email },
        { secret: process.env.JWT_SECRET, expiresIn: '1h' },
      );

      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

      try {
        await this.mailerService.sendMail({
          to: user.email,
          subject: 'Password Reset Request',
          html: `
          <h3>Password Reset Request</h3>
          <p>You requested to reset your password.</p>
          <p>Please click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        `,
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        throw new Error('Failed to send reset email. Please try again later.');
      }

      return { email: user.email };
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(
    resetToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const decoded = this.jwtService.verify(resetToken, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.userModel.findById(decoded.id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const saltRounds = 10;
      user.password = await bcrypt.hash(newPassword, saltRounds);
      await user.save();

      return { message: 'Password has been successfully reset' };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
}
