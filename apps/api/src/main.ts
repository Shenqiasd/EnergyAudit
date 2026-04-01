import 'reflect-metadata';

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import postgres from 'postgres';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await sql`CREATE TABLE IF NOT EXISTS _migrations (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    const migrationsDir = resolve(__dirname, 'db', 'migrations');
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    const applied = await sql`SELECT name FROM _migrations ORDER BY name`;
    const appliedSet = new Set(applied.map((r) => r.name));
    for (const file of files) {
      if (appliedSet.has(file)) continue;
      console.log(`[Migration] Applying: ${file}`);
      const content = readFileSync(resolve(migrationsDir, file), 'utf8');
      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx.unsafe('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      });
    }
  } catch (err) {
    console.error('[Migration] Error:', err);
  } finally {
    await sql.end();
  }
}

async function bootstrap() {
  await runMigrations();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  // Add root route handler
  app.getHttpAdapter().get('/', (req, res) => {
    res.send({
      message: 'Energy Audit API',
      version: '0.1.0',
      health: '/api/v1/health',
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap();
