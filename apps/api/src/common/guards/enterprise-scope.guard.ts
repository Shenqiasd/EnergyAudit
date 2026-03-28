import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../../modules/auth/public.decorator';

import type { FastifyRequest } from 'fastify';

interface AuthenticatedUser {
  id: string;
  role: string;
  enterpriseId: string | null;
}

@Injectable()
export class EnterpriseScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = (request as FastifyRequest & { user?: AuthenticatedUser }).user;

    if (!user) {
      return true;
    }

    // Manager and reviewer roles can access all enterprises
    if (user.role === 'manager' || user.role === 'reviewer') {
      return true;
    }

    // Enterprise users can only access their own enterprise data
    if (user.role === 'enterprise_user') {
      const enterpriseIdParam = (request.params as Record<string, string>)?.enterpriseId
        || (request.params as Record<string, string>)?.id;
      const enterpriseIdQuery = (request.query as Record<string, string>)?.enterpriseId;
      const enterpriseIdBody = (request.body as Record<string, string>)?.enterpriseId;

      const requestedEnterpriseId = enterpriseIdParam || enterpriseIdQuery || enterpriseIdBody;

      if (requestedEnterpriseId && user.enterpriseId && requestedEnterpriseId !== user.enterpriseId) {
        throw new ForbiddenException('无权访问其他企业的数据');
      }
    }

    return true;
  }
}
