import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from '../../src/modules/auth/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(
    user: { id: string; role: string; enterpriseId?: string | null } | null,
  ): ExecutionContext {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user,
        }),
      }),
      getType: vi.fn().mockReturnValue('http'),
      getArgs: vi.fn().mockReturnValue([]),
      getArgByIndex: vi.fn(),
      switchToRpc: vi.fn(),
      switchToWs: vi.fn(),
    } as unknown as ExecutionContext;
  }

  it('should allow access when route is public', () => {
    const context = createMockContext(null);
    vi.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(true)  // isPublic
      .mockReturnValueOnce(null); // roles

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when no roles are required', () => {
    const context = createMockContext({ id: 'user-1', role: 'manager' });
    vi.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)  // isPublic
      .mockReturnValueOnce(null);  // roles (none required)

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    const context = createMockContext({ id: 'user-1', role: 'manager' });
    vi.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)                        // isPublic
      .mockReturnValueOnce(['manager', 'reviewer']);      // roles

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    const context = createMockContext({ id: 'user-1', role: 'enterprise_user' });
    vi.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)              // isPublic
      .mockReturnValueOnce(['manager']);        // roles

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user is present', () => {
    const context = createMockContext(null);
    vi.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)              // isPublic
      .mockReturnValueOnce(['manager']);        // roles

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when empty roles array is specified', () => {
    const context = createMockContext({ id: 'user-1', role: 'enterprise_user' });
    vi.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)    // isPublic
      .mockReturnValueOnce([]);      // roles (empty)

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should check all three roles correctly', () => {
    const allRoles = ['enterprise_user', 'manager', 'reviewer'];

    for (const role of allRoles) {
      const context = createMockContext({ id: 'user-1', role });
      vi.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(false)       // isPublic
        .mockReturnValueOnce(allRoles);   // roles

      expect(guard.canActivate(context)).toBe(true);
    }
  });

  it('should deny access for unknown role', () => {
    const context = createMockContext({ id: 'user-1', role: 'unknown_role' });
    vi.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)                                      // isPublic
      .mockReturnValueOnce(['enterprise_user', 'manager', 'reviewer']); // roles

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
