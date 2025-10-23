import { randomBytes } from 'crypto';
import { prisma } from '../config/database';

export interface DiscountCode {
  id: string;
  code: string;
  sessionId: string;
  percentage: number;    // 30% discount
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

/**
 * Service to manage discount codes for completed diagnostics
 */
export class DiscountService {
  /**
   * Default discount percentage for completing the diagnostic
   */
  private readonly DEFAULT_DISCOUNT_PERCENTAGE = 30;

  /**
   * Number of days until the discount expires
   */
  private readonly EXPIRATION_DAYS = 7;

  /**
   * Generates a unique discount code
   * Format: DIAG-XXXX-XXXX (easy to read and copy)
   */
  generateCode(): string {
    const random1 = randomBytes(2).toString('hex').toUpperCase();
    const random2 = randomBytes(2).toString('hex').toUpperCase();
    return `DIAG-${random1}-${random2}`;
  }

  /**
   * Creates a discount code for a completed diagnostic session
   *
   * @param sessionId - The session ID that completed the diagnostic
   * @param diagnosticMode - The mode used (express/standard/deep)
   * @param engagementScore - The user's engagement score
   * @returns The created discount code
   */
  async createDiscountForSession(
    sessionId: string,
    diagnosticMode: 'express' | 'standard' | 'deep',
    engagementScore: number
  ): Promise<DiscountCode> {
    const code = this.generateCode();

    // All users get the same 30% discount for completing the diagnostic
    const percentage = this.DEFAULT_DISCOUNT_PERCENTAGE;

    // Expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.EXPIRATION_DAYS);

    const discount = await prisma.discountCode.create({
      data: {
        code,
        sessionId,
        percentage,
        expiresAt,
        used: false,
      },
    });

    return discount as DiscountCode;
  }

  /**
   * Validates and redeems a discount code
   *
   * @param code - The discount code to redeem
   * @returns The discount code if valid
   * @throws Error if code is invalid, expired, or already used
   */
  async redeemCode(code: string): Promise<DiscountCode> {
    const discount = await prisma.discountCode.findUnique({
      where: { code },
    });

    if (!discount) {
      throw new Error('Código de descuento inválido');
    }

    // Validate not already used
    if (discount.used) {
      throw new Error('Este código ya ha sido usado');
    }

    // Validate not expired
    if (new Date() > discount.expiresAt) {
      throw new Error('Este código ha expirado');
    }

    // Mark as used
    const updatedDiscount = await prisma.discountCode.update({
      where: { code },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    return updatedDiscount as DiscountCode;
  }

  /**
   * Gets the discount code for a session
   *
   * @param sessionId - The session ID
   * @returns The discount code or null if not found
   */
  async getDiscountBySession(sessionId: string): Promise<DiscountCode | null> {
    const discount = await prisma.discountCode.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return discount as DiscountCode | null;
  }

  /**
   * Validates if a discount code is valid (not used and not expired)
   *
   * @param code - The discount code to validate
   * @returns Object with validation result
   */
  async validateCode(code: string): Promise<{
    isValid: boolean;
    percentage?: number;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      const discount = await prisma.discountCode.findUnique({
        where: { code },
      });

      if (!discount) {
        return {
          isValid: false,
          error: 'Código no encontrado',
        };
      }

      if (discount.used) {
        return {
          isValid: false,
          error: 'Código ya usado',
        };
      }

      if (new Date() > discount.expiresAt) {
        return {
          isValid: false,
          error: 'Código expirado',
        };
      }

      return {
        isValid: true,
        percentage: discount.percentage,
        expiresAt: discount.expiresAt,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Error al validar el código',
      };
    }
  }
}
