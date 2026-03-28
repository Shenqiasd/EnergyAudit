import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

interface TokenPayload {
  accessToken: string;
  refreshToken: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  enterpriseId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(email: string, password: string, name: string, role: string): Promise<{ user: AuthUser; tokens: TokenPayload }> {
    const [existing] = await this.db
      .select({ id: schema.userAccounts.id })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.email, email))
      .limit(1);

    if (existing) {
      throw new ConflictException('该邮箱已被注册');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const [user] = await this.db
      .insert(schema.userAccounts)
      .values({
        id: userId,
        email,
        name,
        role,
        passwordHash,
        status: 'active',
      })
      .returning({
        id: schema.userAccounts.id,
        email: schema.userAccounts.email,
        name: schema.userAccounts.name,
        role: schema.userAccounts.role,
        enterpriseId: schema.userAccounts.enterpriseId,
      });

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async login(email: string, password: string): Promise<{ user: AuthUser; tokens: TokenPayload }> {
    const [user] = await this.db
      .select({
        id: schema.userAccounts.id,
        email: schema.userAccounts.email,
        name: schema.userAccounts.name,
        role: schema.userAccounts.role,
        enterpriseId: schema.userAccounts.enterpriseId,
        passwordHash: schema.userAccounts.passwordHash,
        status: schema.userAccounts.status,
      })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.email, email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('邮箱或密码不正确');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('账户已被禁用');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('账户未设置密码，请联系管理员');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码不正确');
    }

    await this.db
      .update(schema.userAccounts)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.userAccounts.id, user.id));

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      enterpriseId: user.enterpriseId,
    };

    const tokens = await this.generateTokens(authUser);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: authUser, tokens };
  }

  async refreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.getRefreshSecret(),
      });

      const [user] = await this.db
        .select({
          id: schema.userAccounts.id,
          email: schema.userAccounts.email,
          name: schema.userAccounts.name,
          role: schema.userAccounts.role,
          enterpriseId: schema.userAccounts.enterpriseId,
          refreshToken: schema.userAccounts.refreshToken,
          status: schema.userAccounts.status,
        })
        .from(schema.userAccounts)
        .where(eq(schema.userAccounts.id, payload.sub as string))
        .limit(1);

      if (!user || user.status !== 'active' || !user.refreshToken) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      const isTokenValid = await bcrypt.compare(token, user.refreshToken);
      if (!isTokenValid) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        enterpriseId: user.enterpriseId,
      };

      const tokens = await this.generateTokens(authUser);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  async validateUser(userId: string): Promise<AuthUser | null> {
    const [user] = await this.db
      .select({
        id: schema.userAccounts.id,
        email: schema.userAccounts.email,
        name: schema.userAccounts.name,
        role: schema.userAccounts.role,
        enterpriseId: schema.userAccounts.enterpriseId,
      })
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.id, userId))
      .limit(1);

    return user ?? null;
  }

  async logout(userId: string): Promise<void> {
    await this.db
      .update(schema.userAccounts)
      .set({ refreshToken: null })
      .where(eq(schema.userAccounts.id, userId));
  }

  private async generateTokens(user: AuthUser): Promise<TokenPayload> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: '30m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshSecret(),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.db
      .update(schema.userAccounts)
      .set({ refreshToken: hashedToken })
      .where(eq(schema.userAccounts.id, userId));
  }

  private getAccessSecret(): string {
    return this.configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret-change-in-production';
  }

  private getRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev-jwt-refresh-secret-change-in-production';
  }
}
