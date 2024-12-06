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
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { OrganizerGuard } from 'src/guards/organizer.guard';
import { FastifyRequest } from 'fastify';
import { FileUpload } from '../types/file-upload.interface';
import { EventStatus } from './entities/event.entity';

@Controller('event')
@UseGuards(OrganizerGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  //   @Post()
  //   async create(@Body() createEventDto: CreateEventDto) {
  //   return await this.eventService.create(createEventDto);
  // }

  @Post()
  async create(@Req() request: FastifyRequest) {
    try {
      // console.log('Request received:', request.headers);

      const data = await request.file();
      // console.log('File data:', data);

      if (!data) {
        throw new BadRequestException('No file uploaded');
      }

      const chunks = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      // console.log('Buffer created successfully, size:', buffer.length);

      const createEventDto: CreateEventDto = {
        title: data.fields.title['value'],
        description: data.fields.description['value'],
        location: data.fields.location['value'],
        startDate: new Date(JSON.parse(data.fields.startDate['value'])),
        endDate: new Date(JSON.parse(data.fields.endDate['value'])),
        organizer: data.fields.organizer['value'],
        participants: JSON.parse(data.fields.participants['value']),
        status: EventStatus.SCHEDULED,
      };

      // console.log('CreateEventDto:', createEventDto);

      const fileUpload: FileUpload = {
        buffer,
        originalname: data.filename,
        mimetype: data.mimetype,
      };

      // console.log('About to create event with:', {
      //   dto: createEventDto,
      //   file: {
      //     name: fileUpload.originalname,
      //     size: fileUpload.buffer.length,
      //     type: fileUpload.mimetype
      //   }
      // });

      // const result = await this.eventService.create(createEventDto, fileUpload);
      // console.log('Service create completed successfully:', result);
      // return result;

      return await this.eventService.create(createEventDto, fileUpload);
    } catch (error) {
      console.error('Error details:', error.message);
      throw new BadRequestException('Invalid file upload');
    }
  }

  @Get()
  async findAll() {
    return await this.eventService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.eventService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return await this.eventService.update(id, updateEventDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.eventService.remove(id);
  }
}
