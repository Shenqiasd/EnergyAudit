import { describe, expect, it } from 'vitest';

import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from '../../src/modules/health/health.module';
import { DatabaseModule, DRIZZLE } from '../../src/db/database.module';

describe('health endpoint', () => {
  it('GET /api/v1/health returns ok', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HealthModule,
      ],
    })
      .useMocker((token) => {
        if (token === DRIZZLE) {
          return {
            execute: async () => [{ '?column?': 1 }],
          };
        }
        return undefined;
      })
      .compile();

    const app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const result = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.payload);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();

    await app.close();
  });

  it('GET /api/v1/health/db returns db status', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HealthModule,
      ],
    })
      .useMocker((token) => {
        if (token === DRIZZLE) {
          return {
            execute: async () => [{ '?column?': 1 }],
          };
        }
        return undefined;
      })
      .compile();

    const app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const result = await app.inject({
      method: 'GET',
      url: '/api/v1/health/db',
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.payload);
    expect(body.status).toBe('ok');
    expect(body.database).toBe('connected');

    await app.close();
  });

  it('GET /api/v1/health/db returns 503 when database is down', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HealthModule,
      ],
    })
      .useMocker((token) => {
        if (token === DRIZZLE) {
          return {
            execute: async () => { throw new Error('connection refused'); },
          };
        }
        return undefined;
      })
      .compile();

    const app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const result = await app.inject({
      method: 'GET',
      url: '/api/v1/health/db',
    });

    expect(result.statusCode).toBe(503);
    const body = JSON.parse(result.payload);
    expect(body.status).toBe('error');
    expect(body.database).toBe('disconnected');

    await app.close();
  });
});
