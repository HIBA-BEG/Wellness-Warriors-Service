import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FastifyRequest } from 'fastify';
import { FileUpload } from '../types/file-upload.interface';

export async function readMultipart(request: FastifyRequest): Promise<{
  fields: Record<string, string>;
  file?: FileUpload;
}> {
  const multipartRequest = request as FastifyRequest & {
    isMultipart?: () => boolean;
    parts?: () => AsyncIterable<any>;
  };

  if (
    typeof multipartRequest.parts !== 'function' ||
    multipartRequest.isMultipart?.() === false
  ) {
    throw new BadRequestException('Expected multipart/form-data');
  }

  const fields: Record<string, string> = {};
  let file: FileUpload | undefined;

  for await (const part of multipartRequest.parts()) {
    if (part.type === 'file') {
      const buffer = await part.toBuffer();
      if (!file) {
        file = {
          buffer,
          originalname: part.filename,
          mimetype: part.mimetype,
        };
      }
      continue;
    }

    fields[part.fieldname] = part.value == null ? '' : String(part.value);
  }

  return { fields, file };
}

export async function assertValid<T extends object>(
  cls: new () => T,
  plain: object,
): Promise<T> {
  const instance = plainToInstance(cls, plain);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    throw new BadRequestException(messages);
  }

  return instance;
}
