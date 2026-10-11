import { BadRequestException } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileUpload } from '../types/file-upload.interface';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

export async function savePublicImage(
  file: FileUpload,
  folder: 'uploads' | 'uploads-profile',
): Promise<string> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('Invalid file');
  }

  if (file.buffer.length > MAX_IMAGE_BYTES) {
    throw new BadRequestException('File is too large. Maximum size is 5 MB.');
  }

  const extension = MIME_TO_EXTENSION[file.mimetype];
  if (!extension) {
    throw new BadRequestException(
      'Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.',
    );
  }

  const originalExtension = extname(file.originalname || '').toLowerCase();
  if (originalExtension && !ALLOWED_EXTENSIONS.includes(originalExtension)) {
    throw new BadRequestException(
      'Invalid file extension. Only JPEG, PNG, GIF, and WEBP images are allowed.',
    );
  }

  const uploadDir = join(process.cwd(), folder);
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${uuidv4()}${extension}`;
  await writeFile(join(uploadDir, fileName), file.buffer);

  return `/${folder}/${fileName}`;
}
