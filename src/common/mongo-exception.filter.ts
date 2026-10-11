import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

@Catch(MongooseError.CastError, MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(
    exception: MongooseError.CastError | MongoServerError,
    host: ArgumentsHost,
  ) {
    const { httpAdapter } = this.httpAdapterHost;
    const response = host.switchToHttp().getResponse();

    if (exception instanceof MongooseError.CastError) {
      httpAdapter.reply(
        response,
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid id',
        },
        HttpStatus.BAD_REQUEST,
      );
      return;
    }

    if (exception.code === 11000) {
      const field = Object.keys(exception.keyPattern || {})[0];
      const message =
        field === 'email'
          ? 'This email is already registered'
          : field === 'title'
            ? 'An event with this title already exists'
            : 'That value is already in use';

      httpAdapter.reply(
        response,
        {
          statusCode: HttpStatus.CONFLICT,
          message,
        },
        HttpStatus.CONFLICT,
      );
      return;
    }

    httpAdapter.reply(
      response,
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
