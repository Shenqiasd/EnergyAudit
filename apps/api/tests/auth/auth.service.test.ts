import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
    compare: vi.fn().mockImplementation((plain: string, hash: string) => {
      return Promise.resolve(plain === 'correct-password' && hash === '$2b$10$existinghash');
    }),
  },
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('test-id-123'),
}));

import { AuthService } from '../../src/modules/auth/auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockDb: Record<string, unknown>;
  let mockJwtService: Partial<JwtService>;
  let mockConfigService: Partial<ConfigService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'manager',
    enterpriseId: null,
    status: 'active',
    passwordHash: '$2b$10$existinghash',
    refreshToken: null,
  };

  beforeEach(() => {
    // Mock database
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      }),
    });

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    mockDb = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mock-jwt-token'),
      verifyAsync: vi.fn().mockResolvedValue({ sub: 'user-1', email: 'test@example.com', role: 'manager' }),
    };

    mockConfigService = {
      get: vi.fn().mockReturnValue('test-jwt-secret'),
    };

    authService = new AuthService(
      mockDb as never,
      mockJwtService as JwtService,
      mockConfigService as ConfigService,
    );
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register('new@example.com', 'password123', 'New User', 'manager');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      // Mock select to return existing user
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      (mockDb as Record<string, unknown>).select = mockSelect;

      await expect(
        authService.register('test@example.com', 'password123', 'Test User', 'manager'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      // Mock select to return user with password hash
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      (mockDb as Record<string, unknown>).select = mockSelect;

      const result = await authService.login('test@example.com', 'correct-password');

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      // Mock select to return user
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      (mockDb as Record<string, unknown>).select = mockSelect;

      await expect(
        authService.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for user without password hash', async () => {
      const userNoPassword = { ...mockUser, passwordHash: null };
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([userNoPassword]),
          }),
        }),
      });
      (mockDb as Record<string, unknown>).select = mockSelect;

      await expect(
        authService.login('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const userWithRefreshToken = {
        ...mockUser,
        refreshToken: '$2b$10$hashedrefreshtoken',
      };
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([userWithRefreshToken]),
          }),
        }),
      });
      (mockDb as Record<string, unknown>).select = mockSelect;

      const result = await authService.refreshToken('mock-jwt-token');

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // verifyAsync will throw for invalid token
      (mockJwtService.verifyAsync as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('invalid token'));

      await expect(
        authService.refreshToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid userId', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      (mockDb as Record<string, unknown>).select = mockSelect;

      const result = await authService.validateUser('user-1');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for non-existent userId', async () => {
      const result = await authService.validateUser('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      await authService.logout('user-1');

      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
