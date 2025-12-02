import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import type { ApiResponse } from '../types';
import { emailService } from '../services/email.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

// Token expiry for password reset (24 hours)
const PASSWORD_RESET_EXPIRY_MS = 24 * 60 * 60 * 1000;

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Map Stripe Price IDs to plan names
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  // LIVE MODE (current prices)
  'price_1Sa060AleRjmLgERh1nn1rqB': 'monthly',   // Plan Mensual - 29.99€/mes
  'price_1SZKcVAleRjmLgERXZIruikV': 'yearly',    // Plan Anual - 220€/año
  'price_1Sa060AleRjmLgERpMCZnTYt': 'lifetime',  // Plan Vitalicio - 399.99€

  // LIVE MODE (old prices - keep for existing subscriptions)
  'price_1SZKcUAleRjmLgEROPDE357g': 'monthly',   // Plan Mensual - 30€/mes (old)
  'price_1SZKcWAleRjmLgER8KQYCk2O': 'lifetime',  // Plan Vitalicio - 400€ (old)

  // TEST MODE (keep for staging/dev)
  'price_1SZKswAleRjmLgERGqm3mSsV': 'monthly',   // Plan Mensual TEST - 30€/mes
  'price_1SZKswAleRjmLgER9GBCPrJV': 'yearly',    // Plan Anual TEST - 220€/año
  'price_1SZKsxAleRjmLgERQ8iHe6NC': 'lifetime',  // Plan Vitalicio TEST - 400€
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

        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
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

    // Parse dates safely - Stripe sends Unix timestamps (seconds)
    // Use type assertion to handle Stripe API version differences
    const subAny = subscription as any;
    const currentPeriodStart = subAny.current_period_start
      ? new Date(subAny.current_period_start * 1000)
      : new Date();
    const currentPeriodEnd = subAny.current_period_end
      ? new Date(subAny.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    let isNewUser = false;
    let resetToken: string | undefined;

    if (!user) {
      // Create new user with reset token for password setup
      isNewUser = true;
      resetToken = this.generateResetToken();

      console.log('[Stripe Webhook] Creating new user for:', email);
      user = await prisma.user.create({
        data: {
          email,
          name: customer.name || 'Usuario Pro',
          role: 'PRO',
          stripeCustomerId: customer.id,
          emailVerified: true,
          provider: 'email',
          passwordResetToken: resetToken,
          passwordResetExpiry: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
        },
      });
    } else {
      // Update existing user
      console.log('[Stripe Webhook] Updating existing user:', user.id);
      user = await prisma.user.update({
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
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subAny.canceled_at ? new Date(subAny.canceled_at * 1000) : null,
        trialStart: subAny.trial_start ? new Date(subAny.trial_start * 1000) : null,
        trialEnd: subAny.trial_end ? new Date(subAny.trial_end * 1000) : null,
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
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subAny.canceled_at ? new Date(subAny.canceled_at * 1000) : null,
        trialStart: subAny.trial_start ? new Date(subAny.trial_start * 1000) : null,
        trialEnd: subAny.trial_end ? new Date(subAny.trial_end * 1000) : null,
        metadata: subscription.metadata as any,
      },
    });

    console.log('[Stripe Webhook] ✅ Subscription synced:', {
      userId: user.id,
      email,
      plan,
      status: subscription.status,
    });

    // Send welcome email (only on subscription created, not updated)
    // Check if this is a new subscription by looking at the status
    console.log('[Stripe Webhook] Checking email conditions:', {
      status: subscription.status,
      shouldSendEmail: subscription.status === 'active' || subscription.status === 'trialing',
      isNewUser,
      hasResetToken: !!resetToken,
    });

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      console.log('[Stripe Webhook] 📧 Attempting to send welcome email to:', email);
      try {
        await emailService.sendWelcomeEmail({
          email,
          name: user.name || 'Usuario',
          plan,
          isNewUser,
          ...(resetToken && { resetToken }),
        });
        console.log('[Stripe Webhook] 📧 Welcome email sent successfully to:', email);
      } catch (emailError) {
        console.error('[Stripe Webhook] ❌ Failed to send welcome email:', emailError);
        // Don't throw - subscription is still valid even if email fails
      }
    } else {
      console.log('[Stripe Webhook] ⏭️ Skipping email - subscription status:', subscription.status);
    }
  }

  /**
   * Generate secure reset token
   */
  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);
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

    const invoiceAny = invoice as any;
    if (!invoiceAny.subscription) {
      console.log('[Stripe Webhook] Invoice has no subscription');
      return;
    }

    // Refresh subscription data
    const subscription = await stripe.subscriptions.retrieve(invoiceAny.subscription as string);
    await this.handleSubscriptionCreatedOrUpdated(subscription);
  }

  /**
   * Handle failed payment
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('[Stripe Webhook] Invoice payment failed:', invoice.id);

    const invoiceAny = invoice as any;
    if (!invoiceAny.subscription) {
      console.log('[Stripe Webhook] Invoice has no subscription');
      return;
    }

    // Update subscription to past_due
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoiceAny.subscription as string },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: invoiceAny.subscription as string },
        data: { status: 'past_due' },
      });

      // Optionally downgrade user immediately or wait for subscription.deleted event
      // For now, we'll keep them as PRO but with past_due status
      console.log('[Stripe Webhook] ⚠️ Subscription marked as past_due:', invoiceAny.subscription);
    }
  }

  /**
   * Handle checkout.session.completed - Important for Payment Links
   * This handles both subscription and one-time payments (lifetime plan)
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('[Stripe Webhook] Checkout session completed:', session.id);

    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerId = session.customer as string;

    if (!customerEmail) {
      console.error('[Stripe Webhook] No email in checkout session:', session.id);
      return;
    }

    // If it's a subscription, the subscription events will handle it
    if (session.mode === 'subscription' && session.subscription) {
      console.log('[Stripe Webhook] Subscription checkout - will be handled by subscription events');
      return;
    }

    // Handle one-time payment (lifetime plan)
    if (session.mode === 'payment') {
      console.log('[Stripe Webhook] One-time payment checkout (lifetime plan)');

      // Get line items to determine the plan
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;
      const plan = priceId ? getPlanFromPriceId(priceId) : 'lifetime';

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email: customerEmail },
      });

      let isNewUser = false;
      let resetToken: string | undefined;

      if (!user) {
        isNewUser = true;
        resetToken = this.generateResetToken();

        console.log('[Stripe Webhook] Creating new user for lifetime plan:', customerEmail);
        user = await prisma.user.create({
          data: {
            email: customerEmail,
            name: session.customer_details?.name || 'Usuario Pro',
            role: 'PRO',
            stripeCustomerId: customerId,
            emailVerified: true,
            provider: 'email',
            passwordResetToken: resetToken,
            passwordResetExpiry: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
          },
        });
      } else {
        console.log('[Stripe Webhook] Updating existing user for lifetime plan:', user.id);
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'PRO',
            stripeCustomerId: customerId,
          },
        });
      }

      // Create a "lifetime" subscription record
      const lifetimeEnd = new Date('2099-12-31'); // Far future date for lifetime
      await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeSubscriptionId: `lifetime_${session.id}`, // Use session ID as unique identifier
          stripeCustomerId: customerId,
          stripePriceId: priceId || '',
          stripeProductId: lineItems.data[0]?.price?.product as string || null,
          plan: 'lifetime',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: lifetimeEnd,
          cancelAtPeriodEnd: false,
          metadata: { paymentIntentId: session.payment_intent as string },
        },
      });

      console.log('[Stripe Webhook] ✅ Lifetime subscription created:', {
        userId: user.id,
        email: customerEmail,
        plan: 'lifetime',
      });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail({
          email: customerEmail,
          name: user.name || 'Usuario',
          plan: 'lifetime',
          isNewUser,
          ...(resetToken && { resetToken }),
        });
        console.log('[Stripe Webhook] 📧 Welcome email sent for lifetime plan:', customerEmail);
      } catch (emailError) {
        console.error('[Stripe Webhook] ❌ Failed to send welcome email:', emailError);
      }
    }
  }
}
