import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import type { FastifyRequest } from 'fastify';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const userId = request.headers['x-user-id'] as string | undefined;
    const userRole = request.headers['x-user-role'] as string | undefined;

    if (userId) {
      (request as FastifyRequest & { user?: { id: string; role: string } }).user = {
        id: userId,
        role: userRole ?? 'unknown',
      };
    }

    return true;
  }
}
