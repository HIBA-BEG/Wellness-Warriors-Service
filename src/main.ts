import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { join } from 'path';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(fastifyMultipart as any, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });

  await app.register(fastifyStatic as any, {
    root: join(__dirname, '..', 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  app.enableCors({
    origin: [process.env.CLIENT_URL, 'http://localhost:3000'],
    // origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
