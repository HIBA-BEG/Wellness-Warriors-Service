import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { EventService } from './event.service';
import { UpdateEventDto } from './dto/update-event.dto';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { OrganizerGuard } from '../guards/organizer.guard';
import { FastifyRequest } from 'fastify';
import { EventStatus } from './entities/event.entity';
import { User } from '../user/entities/user.entity';
import { readMultipart } from '../common/multipart';
import { Types } from 'mongoose';

type AuthenticatedRequest = FastifyRequest & { user: User };

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseGuards(OrganizerGuard)
  async create(@Req() request: AuthenticatedRequest) {
    const { fields, file } = await readMultipart(request);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let participants = [];
    if (fields.participants) {
      try {
        participants = JSON.parse(fields.participants);
      } catch {
        throw new BadRequestException('Invalid participants');
      }
    }

    let startDate: Date;
    let endDate: Date;
    try {
      startDate = new Date(JSON.parse(fields.startDate));
      endDate = new Date(JSON.parse(fields.endDate));
    } catch {
      throw new BadRequestException('Invalid event dates');
    }

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid event dates');
    }

    return this.eventService.create(
      {
        title: fields.title,
        description: fields.description,
        location: fields.location,
        startDate,
        endDate,
        organizer: request.user._id as Types.ObjectId,
        participants,
        status: EventStatus.SCHEDULED,
      },
      file,
    );
  }

  @Post('poster')
  @UseGuards(OrganizerGuard)
  async uploadPoster(@Req() request: FastifyRequest) {
    const { file } = await readMultipart(request);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return { poster: await this.eventService.uploadEventImage(file) };
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  async findAll(@Req() request: AuthenticatedRequest) {
    return await this.eventService.findAll({
      id: String(request.user._id),
      role: request.user.role,
    });
  }

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  async findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return await this.eventService.findOne(id, {
      id: String(request.user._id),
      role: request.user.role,
    });
  }

  @Post(':id/join')
  @UseGuards(AccessTokenGuard)
  async join(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.eventService.join(id, {
      id: String(request.user._id),
      role: request.user.role,
    });
  }

  @Delete(':id/join')
  @UseGuards(AccessTokenGuard)
  async leave(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.eventService.leave(id, {
      id: String(request.user._id),
      role: request.user.role,
    });
  }

  @Patch(':id')
  @UseGuards(OrganizerGuard)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.eventService.update(id, updateEventDto, {
      id: String(request.user._id),
      role: request.user.role,
    });
  }

  @Delete(':id')
  @UseGuards(OrganizerGuard)
  async remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return await this.eventService.remove(id, {
      id: String(request.user._id),
      role: request.user.role,
    });
  }
}
