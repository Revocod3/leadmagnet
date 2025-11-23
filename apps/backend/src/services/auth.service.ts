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
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: 'email',
        emailVerified: false, // TODO: Implement email verification
        role: 'FREE',
      },
    });

    logger.info(`User registered: ${user.email}`);

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
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate JWT
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
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
    });

    // If not, check by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
      });

      // Update existing user with googleId
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            provider: 'google',
            emailVerified: true,
          },
        });
      }
    }

    // Create new user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: displayName || email.split('@')[0],
          googleId,
          provider: 'google',
          emailVerified: true,
          role: 'FREE',
          password: null, // No password for OAuth users
        },
      });

      logger.info(`New user created via Google OAuth: ${user.email}`);
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
}

export const authService = new AuthService();
