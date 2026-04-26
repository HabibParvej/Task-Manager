import 'reflect-metadata';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessHttp from 'serverless-http';
import { AppModule } from '../../src/nest/app.module';

// Cache the NestJS handler so the in-memory store survives warm function calls
let cachedHandler: ReturnType<typeof serverlessHttp> | null = null;

async function getHandler() {
  if (cachedHandler) return cachedHandler;

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: false,
  });

  app.enableCors({ origin: '*', methods: ['GET', 'POST', 'DELETE'] });
  app.setGlobalPrefix('api');
  await app.init();

  cachedHandler = serverlessHttp(server);
  return cachedHandler;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const h = await getHandler();
  return h(req as any, res as any);
}

export const config = {
  api: { bodyParser: false },
};
