import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '@nestjs-modules/mailer';
import { User, UserRole } from '../user/entities/user.entity';
import { LoginAuthenticationDto } from './dto/login-authentication.dto';
import { RegisterAuthenticationDto } from './dto/register-authentication.dto';
import { FileUpload } from '../types/file-upload.interface';
import { savePublicImage } from '../common/image-upload';
import {
  TokenType,
  accessTokenExpires,
  resetTokenExpires,
} from '../common/token-type';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async register(
    createAuthDto: RegisterAuthenticationDto,
    file?: FileUpload,
  ): Promise<{ token: string }> {
    const existingUser = await this.userModel.findOne({
      email: createAuthDto.email,
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const profilePicture = file ? await this.uploadUserImage(file) : null;
    const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);

    const user = await this.userModel.create({
      firstName: createAuthDto.firstName,
      lastName: createAuthDto.lastName,
      email: createAuthDto.email,
      gender: createAuthDto.gender,
      password: hashedPassword,
      profilePicture,
      role: UserRole.PARTICIPANT,
    });

    const token = this.jwtService.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        type: TokenType.ACCESS,
      },
      { expiresIn: accessTokenExpires() },
    );

    return { token };
  }

  async uploadUserImage(file: FileUpload): Promise<string> {
    return savePublicImage(file, 'uploads-profile');
  }

  async login(
    loginAuthDto: LoginAuthenticationDto,
  ): Promise<{ token: string }> {
    const user = await this.userModel
      .findOne({ email: loginAuthDto.email })
      .select('+password');

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

    const token = this.jwtService.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        type: TokenType.ACCESS,
      },
      { expiresIn: accessTokenExpires() },
    );

    return { token };
  }

  async verifyToken(token: string) {
    const decoded = this.verifyPurpose(token, TokenType.ACCESS);
    const user = await this.userModel
      .findOne({ email: decoded.email })
      .select('-password');

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      gender: user.gender,
      profilePicture: user.profilePicture,
    };
  }

  async forgotPassword(email: string): Promise<{ email: string }> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User with this email does not exist');
    }

    const resetToken = this.jwtService.sign(
      { id: user._id, email: user.email, type: TokenType.RESET },
      { secret: process.env.JWT_SECRET, expiresIn: resetTokenExpires() },
    );

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173')
      .split(',')[0]
      .trim();
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h3>Password Reset Request</h3>
          <p>You requested to reset your password.</p>
          <p>Please click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>This link will expire in ${resetTokenExpires()}.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      throw new Error('Failed to send reset email. Please try again later.');
    }

    return { email: user.email };
  }

  async resetPassword(
    resetToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const decoded = this.verifyPurpose(resetToken, TokenType.RESET);
    const user = await this.userModel.findById(decoded.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: 'Password has been successfully reset' };
  }

  private verifyPurpose(token: string, purpose: TokenType) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (!decoded || decoded.type !== purpose) {
        throw new UnauthorizedException('Invalid token');
      }

      return decoded;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
