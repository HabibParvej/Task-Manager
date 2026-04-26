import 'reflect-metadata';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express } from 'express';
import { AppModule } from '../../src/nest/app.module';

// Cached Express app so the in-memory task store survives warm function calls
let cachedApp: Express | null = null;

async function getApp(): Promise<Express> {
  if (cachedApp) return cachedApp;

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: false,
  });

  app.enableCors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  await app.init();

  cachedApp = server;
  return server;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const app = await getApp();
    app(req as any, res as any);
  } catch (err: any) {
    console.error('Handler error:', err);
    res.status(500).json({ error: err?.message });
  }
}

export const config = {
  api: { bodyParser: false },
};
