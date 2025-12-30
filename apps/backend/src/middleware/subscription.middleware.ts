import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { canBypassProSubscription } from '../config/feature-flags';
import type { ApiResponse } from '../types';

/**
 * Middleware to verify user has an active PRO subscription
 * Use this on routes that require PRO access
 */
export async function requireProSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado',
      } as ApiResponse);
      return;
    }

    // Check if user email is in the bypass list (feature flag)
    if (canBypassProSubscription(user.email)) {
      console.log(`[Subscription Middleware] Bypassing PRO check for: ${user.email}`);
      next();
      return;
    }

    // Check if user has PRO role
    if (user.role !== 'PRO') {
      res.status(403).json({
        success: false,
        error: 'Necesitas una suscripción Pro para acceder a esta función',
        data: {
          requiresSubscription: true,
          currentRole: user.role,
        },
      } as ApiResponse);
      return;
    }

    // Get full user data to check trial status
    const fullUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        trialEndDate: true,
        hasUsedTrial: true,
      },
    });

    // Check if user is in active trial period
    const isInActiveTrial = fullUser?.trialEndDate && fullUser.trialEndDate > new Date();

    if (isInActiveTrial) {
      // User is in trial, allow access
      console.log(`[Subscription Middleware] User ${user.email} is in trial period`);
      next();
      return;
    }

    // Not in trial, verify they have an active subscription in the database
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.userId,
        status: {
          in: ['active', 'trialing'], // Allow both active and trial subscriptions
        },
        currentPeriodEnd: {
          gte: new Date(), // Period hasn't ended
        },
      },
    });

    if (!activeSubscription) {
      // User has PRO role but no active subscription and trial expired - downgrade them
      try {
        await prisma.user.update({
          where: { id: user.userId },
          data: { role: 'FREE' },
        });
      } catch (error: any) {
        // If user not found (P2025), they might have been deleted.
        if (error.code === 'P2025') {
          res.status(401).json({
            success: false,
            error: 'Usuario no encontrado. Por favor, inicia sesión nuevamente.',
          } as ApiResponse);
          return;
        }
        console.error('[Subscription Middleware] Error downgrading user:', error);
      }

      // Determine if trial expired or subscription expired
      const trialExpired = fullUser?.hasUsedTrial && fullUser?.trialEndDate && fullUser.trialEndDate < new Date();

      res.status(403).json({
        success: false,
        error: trialExpired
          ? 'Tu prueba gratuita de 7 días ha terminado. ¡Suscríbete para continuar!'
          : 'Tu suscripción ha expirado. Por favor, renueva tu plan Pro.',
        data: {
          requiresSubscription: true,
          subscriptionExpired: true,
          trialExpired: trialExpired || false,
        },
      } as ApiResponse);
      return;
    }

    // Check if subscription is past due (payment failed)
    if (activeSubscription.status === 'past_due') {
      res.status(403).json({
        success: false,
        error: 'Tu último pago falló. Por favor, actualiza tu método de pago.',
        data: {
          requiresSubscription: true,
          paymentFailed: true,
        },
      } as ApiResponse);
      return;
    }

    // All checks passed - user has valid PRO subscription
    next();
  } catch (error) {
    console.error('[Subscription Middleware] Error verifying subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar la suscripción',
    } as ApiResponse);
  }
}

/**
 * Middleware to check subscription status and attach to request
 * Doesn't block the request, just adds subscription info
 */
export async function attachSubscriptionInfo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      next();
      return;
    }

    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.userId,
        status: {
          in: ['active', 'trialing', 'past_due'],
        },
      },
      orderBy: {
        currentPeriodEnd: 'desc', // Get the most recent one
      },
    });

    // Attach subscription info to request
    (req as any).subscription = subscription || null;

    next();
  } catch (error) {
    console.error('[Subscription Middleware] Error attaching subscription info:', error);
    // Don't block the request on error
    next();
  }
}

/**
 * Check if user has any valid subscription OR is in active trial (doesn't block)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  // First check if user is in active trial
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialEndDate: true },
  });

  if (user?.trialEndDate && user.trialEndDate > new Date()) {
    return true; // User is in active trial
  }

  // Check for paid subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: ['active', 'trialing'],
      },
      currentPeriodEnd: {
        gte: new Date(),
      },
    },
  });

  return !!subscription;
}

/**
 * Sync user's role with their subscription/trial status
 * Call this periodically or on-demand
 */
export async function syncUserRoleWithSubscription(userId: string): Promise<void> {
  const hasActiveSub = await hasActiveSubscription(userId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: hasActiveSub ? 'PRO' : 'FREE',
    },
  });
}
