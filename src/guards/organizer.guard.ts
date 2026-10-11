import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../user/entities/user.entity';
import { authenticateAccessToken } from './access-token';

@Injectable()
export class OrganizerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = await authenticateAccessToken(
      request,
      this.jwtService,
      this.userModel,
    );

    if (user.role !== UserRole.ORGANIZER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only organizers can access this resource');
    }

    return true;
  }
}
