import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { mkdirSync } from 'fs';
import { join } from 'path';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { MongoExceptionFilter } from './common/mongo-exception.filter';
import { uploadRoot } from './common/upload-root';

export function corsOrigins(): string[] {
  const configured = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!configured.includes('http://localhost:5173')) {
    configured.push('http://localhost:5173');
  }

  return configured;
}

// Creates and fully configures the Nest app (Fastify adapter) without
// listening. Shared by the local server (main.ts) and the Vercel function.
export async function createConfiguredApp(
  options: { abortOnError?: boolean } = {},
): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    // Local default (true) keeps the old behaviour. On Vercel we must not let
    // Nest kill the process on a startup error; the handler reports it instead.
    { abortOnError: options.abortOnError ?? true },
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

  // Uploads live next to the project locally, and in /tmp on Vercel
  // (the deployment filesystem is read-only there and /tmp is not persistent).
  const uploadsDir = uploadRoot('uploads');
  const profileUploadsDir = uploadRoot('uploads-profile');
  for (const dir of [uploadsDir, profileUploadsDir]) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (error) {
      console.warn(`Could not create upload directory ${dir}:`, error);
    }
  }

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
    // dist/ sits next to seed-images/ both locally and in the Vercel bundle.
    root: join(__dirname, '..', 'seed-images'),
    prefix: '/seed-images/',
    decorateReply: false,
  });

  app.enableCors({
    origin: corsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  return app;
}
