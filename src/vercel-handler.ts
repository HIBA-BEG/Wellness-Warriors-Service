import type { IncomingMessage, ServerResponse } from 'http';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createConfiguredApp } from './app-setup';

// The Nest app (and its Mongo connection) is created once per warm function
// instance and reused by every invocation.
let cached: Promise<NestFastifyApplication> | undefined;

function getApp(): Promise<NestFastifyApplication> {
  if (!cached) {
    cached = (async () => {
      const app = await createConfiguredApp({ abortOnError: false });
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
      return app;
    })().catch((error) => {
      cached = undefined; // retry on the next request instead of caching a failure
      throw error;
    });
  }
  return cached;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const app = await getApp();
    app.getHttpAdapter().getInstance().server.emit('request', req, res);
  } catch (error) {
    console.error('Failed to start the application:', error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({ statusCode: 500, message: 'Server failed to start' }),
    );
  }
}
