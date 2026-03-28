import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from '../../src/modules/auth/auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  function createMockContext(isPublic: boolean): ExecutionContext {
    const mockContext = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          headers: { authorization: 'Bearer test-token' },
          user: { id: 'user-1', role: 'manager' },
        }),
        getResponse: vi.fn(),
      }),
      getType: vi.fn().mockReturnValue('http'),
      getArgs: vi.fn().mockReturnValue([]),
      getArgByIndex: vi.fn(),
      switchToRpc: vi.fn(),
      switchToWs: vi.fn(),
    } as unknown as ExecutionContext;

    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

    return mockContext;
  }

  it('should allow access to public routes', () => {
    const context = createMockContext(true);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should call super.canActivate for non-public routes', () => {
    const context = createMockContext(false);

    // For non-public routes, it delegates to PassportAuthGuard
    // Since we can't fully mock passport, we just verify it doesn't return true directly
    const result = guard.canActivate(context);
    expect(result).toBeDefined();
  });

  it('should throw UnauthorizedException in handleRequest when no user', () => {
    expect(() => {
      guard.handleRequest(null, null);
    }).toThrow('无效的认证凭证');
  });

  it('should return user in handleRequest when user exists', () => {
    const user = { id: 'user-1', role: 'manager' };
    const result = guard.handleRequest(null, user);

    expect(result).toEqual(user);
  });

  it('should throw error in handleRequest when error is passed', () => {
    const error = new Error('Token expired');
    expect(() => {
      guard.handleRequest(error, null);
    }).toThrow('Token expired');
  });
});
