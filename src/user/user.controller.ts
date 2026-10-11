import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { OrganizerGuard } from '../guards/organizer.guard';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { User } from './entities/user.entity';

type AuthenticatedRequest = { user: User };

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(OrganizerGuard)
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(OrganizerGuard)
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.userService.update(id, updateUserDto, {
      id: String(request.user._id),
      role: request.user.role,
    });
  }

  @Delete(':id')
  @UseGuards(OrganizerGuard)
  async remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return await this.userService.remove(id, {
      id: String(request.user._id),
      role: request.user.role,
    });
  }
}
