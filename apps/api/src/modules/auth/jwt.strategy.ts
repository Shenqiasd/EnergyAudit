import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const [user] = await this.db
      .select({
        id: schema.userAccounts.id,
        email: schema.userAccounts.email,
        name: schema.userAccounts.name,
        role: schema.userAccounts.role,
        enterpriseId: schema.userAccounts.enterpriseId,
        status: schema.userAccounts.status,
      })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.id, payload.sub))
      .limit(1);

    if (!user || user.status !== 'active') {
      return null;
    }

    return user;
  }
}
