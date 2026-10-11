import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { MongoExceptionFilter } from './common/mongo-exception.filter';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { mkdirSync } from 'fs';
import { join } from 'path';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import helmet from '@fastify/helmet';

function corsOrigins(): string[] {
  const configured = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!configured.includes('http://localhost:5173')) {
    configured.push('http://localhost:5173');
  }

  return configured;
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  app.useGlobalFilters(new MongoExceptionFilter(app.get(HttpAdapterHost)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.register(helmet as any, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(fastifyMultipart as any, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });

  const uploadsDir = join(process.cwd(), 'uploads');
  const profileUploadsDir = join(process.cwd(), 'uploads-profile');
  mkdirSync(uploadsDir, { recursive: true });
  mkdirSync(profileUploadsDir, { recursive: true });

  await app.register(fastifyStatic as any, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  });

  await app.register(fastifyStatic as any, {
    root: profileUploadsDir,
    prefix: '/uploads-profile/',
    decorateReply: false,
  });

  await app.register(fastifyStatic as any, {
    root: join(process.cwd(), 'seed-images'),
    prefix: '/seed-images/',
    decorateReply: false,
  });

  app.enableCors({
    origin: corsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
