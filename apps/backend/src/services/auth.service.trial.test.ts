import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../config/database';

// Mock prisma
vi.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { AuthService } from './auth.service';

describe('AuthService - Trial Functionality', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create user with 7-day trial when no existing subscription', async () => {
      // Mock: no existing user
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Mock: no existing Stripe subscription
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

      // Mock: user creation
      const mockCreatedUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PRO',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        hasUsedTrial: true,
      };
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      // Verify user was created with trial fields
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          role: 'PRO',
          hasUsedTrial: true,
          trialStartDate: expect.any(Date),
          trialEndDate: expect.any(Date),
        }),
      });

      // Verify trial end date is ~7 days from now
      const createCall = vi.mocked(prisma.user.create).mock.calls[0][0];
      const trialEnd = createCall.data.trialEndDate as Date;
      const now = new Date();
      const diffDays = Math.round((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);

      expect(result.user.role).toBe('PRO');
    });

    it('should NOT set trial fields when user has existing Stripe subscription', async () => {
      // Mock: no existing user
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Mock: existing Stripe subscription
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: 'sub_123',
        status: 'active',
      } as any);

      // Mock: user creation
      const mockCreatedUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PRO',
        trialStartDate: null,
        trialEndDate: null,
        hasUsedTrial: false,
      };
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any);

      await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      // Verify user was created WITHOUT trial fields
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trialStartDate: null,
          trialEndDate: null,
          hasUsedTrial: false,
        }),
      });
    });
  });

  describe('login - syncUserRoleWithSubscription', () => {
    it('should keep PRO role when user is in active trial period', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'PRO',
        trialEndDate: futureDate,
        hasUsedTrial: true,
        subscriptions: [],
      };

      // First call for login lookup
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser as any) // login lookup
        .mockResolvedValueOnce(mockUser as any); // sync lookup

      // No paid subscription
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Should NOT downgrade to FREE
      expect(result.user.role).toBe('PRO');

      // Should NOT have called update to change role
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should upgrade to PRO if user in trial but role is FREE (recovery)', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      const mockUserWithFreeRole = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'FREE', // Incorrectly set to FREE
        trialEndDate: futureDate,
        hasUsedTrial: true,
        subscriptions: [],
      };

      const mockUserUpdated = {
        ...mockUserWithFreeRole,
        role: 'PRO',
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUserWithFreeRole as any) // login lookup
        .mockResolvedValueOnce(mockUserWithFreeRole as any); // sync lookup

      vi.mocked(prisma.user.update).mockResolvedValue(mockUserUpdated as any);
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Should have upgraded to PRO
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { role: 'PRO' },
        include: { subscriptions: true },
      });
      expect(result.user.role).toBe('PRO');
    });

    it('should downgrade to FREE when trial has expired and no subscription', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'PRO',
        trialEndDate: pastDate,
        hasUsedTrial: true,
        subscriptions: [],
      };

      const mockUserDowngraded = {
        ...mockUser,
        role: 'FREE',
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser as any) // login lookup
        .mockResolvedValueOnce(mockUser as any); // sync lookup

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUserDowngraded as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Should have downgraded to FREE
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { role: 'FREE' },
        include: { subscriptions: true },
      });
      expect(result.user.role).toBe('FREE');
    });

    it('should keep PRO when trial expired but has active subscription', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'PRO',
        trialEndDate: pastDate,
        hasUsedTrial: true,
        subscriptions: [],
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(mockUser as any);

      // Has active subscription
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Should keep PRO because of subscription
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { role: 'PRO' },
        })
      );
    });
  });
});
