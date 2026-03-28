import { Body, Controller, Get, Post, Req } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto';
import { Public } from './public.decorator';

import type { FastifyRequest } from 'fastify';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    enterpriseId: string | null;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { user, tokens } = await this.authService.register(
      dto.email,
      dto.password,
      dto.name,
      dto.role,
    );
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { user, tokens } = await this.authService.login(dto.email, dto.password);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refreshToken(dto.refreshToken);
    return tokens;
  }

  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest) {
    await this.authService.logout(req.user.id);
    return { message: '已退出登录' };
  }
}
