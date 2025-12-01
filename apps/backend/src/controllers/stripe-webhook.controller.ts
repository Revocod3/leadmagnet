import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import type { ApiResponse } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Map Stripe Price IDs to plan names
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  // TEST MODE
  'price_1SZKswAleRjmLgERGqm3mSsV': 'monthly',   // Plan Mensual TEST - 30€/mes
  'price_1SZKswAleRjmLgER9GBCPrJV': 'yearly',    // Plan Anual TEST - 220€/año
  'price_1SZKsxAleRjmLgERQ8iHe6NC': 'lifetime',  // Plan Vitalicio TEST - 400€

  // LIVE MODE (commented out for now)
  // 'price_1SZKcUAleRjmLgEROPDE357g': 'monthly',   // Plan Mensual - 30€/mes
  // 'price_1SZKcVAleRjmLgERXZIruikV': 'yearly',    // Plan Anual - 220€/año
  // 'price_1SZKcWAleRjmLgER8KQYCk2O': 'lifetime',  // Plan Vitalicio - 400€
};

// Get plan name from Stripe price ID
function getPlanFromPriceId(priceId: string): string {
  return PRICE_TO_PLAN_MAP[priceId] || 'unknown';
}

// Get plan name from product metadata or amount
function getPlanFromSubscription(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId && PRICE_TO_PLAN_MAP[priceId]) {
    return PRICE_TO_PLAN_MAP[priceId];
  }

  // Fallback: determine by amount
  const amount = subscription.items.data[0]?.price.unit_amount || 0;
  const interval = subscription.items.data[0]?.price.recurring?.interval;

  if (interval === 'month' && amount === 3000) return 'monthly'; // 30€
  if (interval === 'year' && amount === 22000) return 'yearly'; // 220€
  if (amount === 40000) return 'lifetime'; // 400€

  return 'unknown';
}

export class StripeWebhookController {
  /**
   * Handle Stripe webhooks
   * POST /api/webhooks/stripe
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      res.status(400).json({
        success: false,
        error: `Webhook signature verification failed: ${err.message}`,
      } as ApiResponse);
      return;
    }

    console.log('[Stripe Webhook] Event received:', event.type);

    try {
      // Handle different event types
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionCreatedOrUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.created':
          // Just log for now
          console.log('[Stripe Webhook] Customer created:', event.data.object);
          break;

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({
        success: true,
        data: { received: true },
      } as ApiResponse);
    } catch (error: any) {
      console.error('[Stripe Webhook] Error processing webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Error processing webhook',
      } as ApiResponse);
    }
  }

  /**
   * Handle subscription created or updated
   */
  private async handleSubscriptionCreatedOrUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('[Stripe Webhook] Processing subscription:', subscription.id);

    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string);

    if (customer.deleted) {
      console.error('[Stripe Webhook] Customer was deleted:', subscription.customer);
      return;
    }

    const email = customer.email;
    if (!email) {
      console.error('[Stripe Webhook] Customer has no email:', customer.id);
      return;
    }

    const plan = getPlanFromSubscription(subscription);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      console.log('[Stripe Webhook] Creating new user for:', email);
      user = await prisma.user.create({
        data: {
          email,
          name: customer.name || 'Usuario Pro',
          role: 'PRO',
          stripeCustomerId: customer.id,
          emailVerified: true,
          provider: 'email',
        },
      });
    } else {
      // Update existing user
      console.log('[Stripe Webhook] Updating existing user:', user.id);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'PRO',
          stripeCustomerId: customer.id,
        },
      });
    }

    // Upsert subscription
    await prisma.subscription.upsert({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      update: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        stripePriceId: subscription.items.data[0]?.price.id || '',
        stripeProductId: subscription.items.data[0]?.price.product as string || null,
        metadata: subscription.metadata as any,
      },
      create: {
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        stripePriceId: subscription.items.data[0]?.price.id || '',
        stripeProductId: subscription.items.data[0]?.price.product as string || null,
        plan,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        metadata: subscription.metadata as any,
      },
    });

    console.log('[Stripe Webhook] ✅ Subscription synced:', {
      userId: user.id,
      email,
      plan,
      status: subscription.status,
    });
  }

  /**
   * Handle subscription deleted/canceled
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('[Stripe Webhook] Subscription deleted:', subscription.id);

    // Update subscription status
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true },
    });

    if (!dbSubscription) {
      console.log('[Stripe Webhook] Subscription not found in DB:', subscription.id);
      return;
    }

    // Update subscription to canceled
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    // Check if user has any other active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: dbSubscription.userId,
        status: 'active',
        id: { not: dbSubscription.id }, // Exclude current subscription
      },
    });

    // If no other active subscriptions, downgrade to FREE
    if (activeSubscriptions.length === 0) {
      await prisma.user.update({
        where: { id: dbSubscription.userId },
        data: { role: 'FREE' },
      });

      console.log('[Stripe Webhook] ⬇️ User downgraded to FREE:', dbSubscription.user.email);
    }
  }

  /**
   * Handle successful payment
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('[Stripe Webhook] Invoice payment succeeded:', invoice.id);

    if (!invoice.subscription) {
      console.log('[Stripe Webhook] Invoice has no subscription');
      return;
    }

    // Refresh subscription data
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await this.handleSubscriptionCreatedOrUpdated(subscription);
  }

  /**
   * Handle failed payment
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('[Stripe Webhook] Invoice payment failed:', invoice.id);

    if (!invoice.subscription) {
      console.log('[Stripe Webhook] Invoice has no subscription');
      return;
    }

    // Update subscription to past_due
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'past_due' },
      });

      // Optionally downgrade user immediately or wait for subscription.deleted event
      // For now, we'll keep them as PRO but with past_due status
      console.log('[Stripe Webhook] ⚠️ Subscription marked as past_due:', invoice.subscription);
    }
  }
}
