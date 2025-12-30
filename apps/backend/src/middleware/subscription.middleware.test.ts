import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// Mock prisma
vi.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock feature flags
vi.mock('../config/feature-flags', () => ({
  canBypassProSubscription: vi.fn().mockReturnValue(false),
}));

import { requireProSubscription, hasActiveSubscription } from './subscription.middleware';

describe('Subscription Middleware - Trial Functionality', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      user: {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'PRO',
      },
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  describe('requireProSubscription', () => {
    it('should allow access when user is in active trial period', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        trialEndDate: futureDate,
        hasUsedTrial: true,
      } as any);

      await requireProSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should block access when trial has expired and no subscription', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        trialEndDate: pastDate,
        hasUsedTrial: true,
      } as any);

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await requireProSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Tu prueba gratuita de 7 días ha terminado. ¡Suscríbete para continuar!',
          data: expect.objectContaining({
            trialExpired: true,
          }),
        })
      );
    });

    it('should allow access when trial expired but has active subscription', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        trialEndDate: pastDate,
        hasUsedTrial: true,
      } as any);

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as any);

      await requireProSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow access for Stripe trialing subscription', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        trialEndDate: null,
        hasUsedTrial: false,
      } as any);

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: 'sub_123',
        status: 'trialing', // Stripe trial
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      } as any);

      await requireProSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should block FREE users even with valid trial dates', async () => {
      mockReq.user!.role = 'FREE';

      await requireProSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requiresSubscription: true,
          }),
        })
      );
    });

    it('should downgrade user to FREE when trial expired', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        trialEndDate: pastDate,
        hasUsedTrial: true,
      } as any);

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await requireProSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { role: 'FREE' },
      });
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return true when user is in active trial', async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        trialEndDate: futureDate,
      } as any);

      const result = await hasActiveSubscription('user_123');

      expect(result).toBe(true);
      // Should not check for subscription since trial is active
      expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
    });

    it('should return false when trial expired and no subscription', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        trialEndDate: pastDate,
      } as any);

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

      const result = await hasActiveSubscription('user_123');

      expect(result).toBe(false);
    });

    it('should return true when trial expired but has subscription', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        trialEndDate: pastDate,
      } as any);

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: 'sub_123',
        status: 'active',
      } as any);

      const result = await hasActiveSubscription('user_123');

      expect(result).toBe(true);
    });

    it('should return true for user with no trial but active subscription', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        trialEndDate: null,
      } as any);

      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: 'sub_123',
        status: 'active',
      } as any);

      const result = await hasActiveSubscription('user_123');

      expect(result).toBe(true);
    });
  });
});
