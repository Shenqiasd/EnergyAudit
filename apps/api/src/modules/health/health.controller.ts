import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  async checkDb() {
    try {
      await this.db.execute(sql`SELECT 1`);
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
