import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { storedAssetPath } from '../common/asset-url';

export type AuthActor = {
  id: string;
  role: string;
};

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll(): Promise<User[]> {
    return this.userModel
      .find({ role: UserRole.PARTICIPANT })
      .select('-password');
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new HttpException('User not Found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actor: AuthActor,
  ): Promise<User> {
    const existing = await this.userModel.findById(id);
    if (!existing) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    await this.assertCanModify(existing, actor);

    const changes: Record<string, string> = {};
    for (const field of [
      'firstName',
      'lastName',
      'email',
      'profilePicture',
      'gender',
    ] as const) {
      if (updateUserDto[field] !== undefined) {
        changes[field] =
          field === 'profilePicture'
            ? storedAssetPath(updateUserDto[field])
            : updateUserDto[field];
      }
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, changes, { new: true })
      .select('-password');

    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async remove(id: string, actor: AuthActor): Promise<{ message: string }> {
    const existing = await this.userModel.findById(id);
    if (!existing) {
      throw new HttpException('User not Found', HttpStatus.NOT_FOUND);
    }

    const canDelete = await this.managesParticipant(existing, actor);

    if (!canDelete) {
      throw new ForbiddenException('You can only delete participant accounts');
    }

    await this.userModel.findByIdAndDelete(id);
    return { message: 'User deleted successfully' };
  }

  private async assertCanModify(target: User, actor: AuthActor) {
    const isSelf = String(target._id) === String(actor.id);
    if (isSelf || (await this.managesParticipant(target, actor))) {
      return;
    }

    throw new ForbiddenException('You can only modify your own account');
  }

  private async managesParticipant(target: User, actor: AuthActor) {
    if (target.role !== UserRole.PARTICIPANT) {
      return false;
    }

    if (actor.role === UserRole.ADMIN) {
      return true;
    }

    if (actor.role !== UserRole.ORGANIZER) {
      return false;
    }

    const organizer = await this.userModel.findById(actor.id);
    const created = new Set(
      (organizer?.createdEvents || []).map((eventId) => String(eventId)),
    );
    return (target.attendingEvents || []).some((eventId) =>
      created.has(String(eventId)),
    );
  }
}
