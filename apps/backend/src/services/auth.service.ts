import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  /**
   * Register new user with email/password
   */
  async register(data: RegisterData) {
    const { email, password, name } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { subscriptions: true },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Check if email has an active subscription in Stripe (from WordPress purchase)
    const hasActiveSubscription = await this.checkEmailHasStripeSubscription(email);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with appropriate role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: 'email',
        emailVerified: false, // TODO: Implement email verification
        role: hasActiveSubscription ? 'PRO' : 'FREE',
      },
    });

    logger.info(`User registered: ${user.email} (role: ${user.role})`);

    // Generate JWT
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Login with email/password
   */
  async login(data: LoginData) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscriptions: true },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Sync user role with current subscription status
    const updatedUser = await this.syncUserRoleWithSubscription(user.id);

    logger.info(`User logged in: ${updatedUser.email} (role: ${updatedUser.role})`);

    // Generate JWT with updated role
    const token = this.generateToken(updatedUser);

    return {
      user: this.sanitizeUser(updatedUser),
      token,
    };
  }

  /**
   * Find or create user from Google OAuth
   */
  async findOrCreateGoogleUser(profile: any) {
    const { id: googleId, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      throw new Error('No email provided by Google');
    }

    // Check if user exists by googleId
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: { subscriptions: true },
    });

    // If not, check by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
        include: { subscriptions: true },
      });

      // Update existing user with googleId
      if (user) {
        // Sync role with subscription before updating
        const hasActiveSub = await this.checkEmailHasStripeSubscription(email);

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            provider: 'google',
            emailVerified: true,
            role: hasActiveSub ? 'PRO' : user.role, // Upgrade if subscription exists
          },
          include: { subscriptions: true },
        });
      }
    }

    // Create new user if doesn't exist
    if (!user) {
      // Check if email has a subscription from WordPress
      const hasActiveSubscription = await this.checkEmailHasStripeSubscription(email);

      user = await prisma.user.create({
        data: {
          email,
          name: displayName || email.split('@')[0],
          googleId,
          provider: 'google',
          emailVerified: true,
          role: hasActiveSubscription ? 'PRO' : 'FREE',
          password: null, // No password for OAuth users
        },
        include: { subscriptions: true },
      });

      logger.info(`New user created via Google OAuth: ${user.email} (role: ${user.role})`);
    } else {
      // Sync existing user's role
      user = await this.syncUserRoleWithSubscription(user.id);
    }

    return user;
  }

  /**
   * Generate JWT token
   */
  generateToken(user: any): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Check if email has an active Stripe subscription
   */
  private async checkEmailHasStripeSubscription(email: string): Promise<boolean> {
    // Check in database first
    const subscription = await prisma.subscription.findFirst({
      where: {
        user: {
          email,
        },
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
   * Sync user role with their subscription status
   */
  private async syncUserRoleWithSubscription(userId: string) {
    const activeSubscription = await prisma.subscription.findFirst({
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

    const hasActiveSub = !!activeSubscription;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: hasActiveSub ? 'PRO' : 'FREE',
      },
      include: { subscriptions: true },
    });

    return updatedUser;
  }

  /**
   * Set password for user (for users created via webhook)
   */
  async setPassword(email: string, password: string, resetToken?: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // If resetToken is provided, verify it
    if (resetToken) {
      if (!user.passwordResetToken || user.passwordResetToken !== resetToken) {
        throw new Error('Invalid reset token');
      }

      if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        throw new Error('Reset token has expired');
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        emailVerified: true,
      },
    });

    logger.info(`Password set for user: ${user.email}`);

    // Generate JWT
    const token = this.generateToken(updatedUser);

    return {
      user: this.sanitizeUser(updatedUser),
      token,
    };
  }

  /**
   * Request password reset (generate token)
   */
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }

    // Generate reset token
    const resetToken = this.generateResetToken();
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    logger.info(`Password reset requested for: ${user.email}`);

    return {
      success: true,
      resetToken, // In production, send this via email
    };
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
   * Complete user onboarding
   */
  async completeOnboarding(userId: string, data: { name: string; birthDate: Date }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        birthDate: data.birthDate,
        onboardingCompleted: true,
      },
    });

    logger.info(`Onboarding completed for user: ${user.email}`);

    return this.sanitizeUser(user);
  }
}

export const authService = new AuthService();
