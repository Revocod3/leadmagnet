import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

// WordPress MySQL connection config
const WORDPRESS_DB_CONFIG = {
  host: process.env.WORDPRESS_DB_HOST || 'localhost',
  user: process.env.WORDPRESS_DB_USER || 'wordpress',
  password: process.env.WORDPRESS_DB_PASSWORD || '',
  database: process.env.WORDPRESS_DB_NAME || 'wordpress_prod',
  port: parseInt(process.env.WORDPRESS_DB_PORT || '3306'),
};

// Commission rates by plan (30% as configured in UAP)
const COMMISSION_RATES: Record<string, number> = {
  monthly: 0.30,  // 30% of 29.99 = 8.997
  yearly: 0.30,   // 30% of 220 = 66
  lifetime: 0.30, // 30% of 399.99 = 119.997
};

// Plan prices
const PLAN_PRICES: Record<string, number> = {
  monthly: 29.99,
  yearly: 220,
  lifetime: 399.99,
};

export interface AffiliateReferralData {
  affiliateId: number;
  plan: string;
  amount: number;
  stripeSubscriptionId: string;
  customerEmail: string;
}

export class AffiliateService {
  private pool: mysql.Pool | null = null;

  /**
   * Get MySQL connection pool for WordPress DB
   */
  private async getPool(): Promise<mysql.Pool> {
    if (!this.pool) {
      this.pool = mysql.createPool({
        ...WORDPRESS_DB_CONFIG,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
      });
    }
    return this.pool;
  }

  /**
   * Parse affiliate ID from client_reference_id
   * Format: aff_8 -> 8
   */
  parseAffiliateId(clientReferenceId: string | null): number | null {
    if (!clientReferenceId) return null;

    const match = clientReferenceId.match(/^aff_(\d+)$/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  /**
   * Calculate commission for a plan
   */
  calculateCommission(plan: string): number {
    const price = PLAN_PRICES[plan] || 0;
    const rate = COMMISSION_RATES[plan] || 0.30;
    const commission = price * rate;
    return Math.round(commission * 100) / 100; // Round to 2 decimals
  }

  /**
   * Verify affiliate exists and is active
   */
  async verifyAffiliate(affiliateId: number): Promise<boolean> {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT id, status FROM wp_uap_affiliates WHERE id = ? AND status = 1',
        [affiliateId]
      );
      return rows.length > 0;
    } catch (error) {
      logger.error('[AffiliateService] Error verifying affiliate:', { error, affiliateId });
      return false;
    }
  }

  /**
   * Create a referral record in WordPress UAP
   */
  async createReferral(data: AffiliateReferralData): Promise<boolean> {
    try {
      const pool = await this.getPool();

      // Verify affiliate exists
      const affiliateExists = await this.verifyAffiliate(data.affiliateId);
      if (!affiliateExists) {
        logger.warn('[AffiliateService] Affiliate not found or inactive:', { affiliateId: data.affiliateId });
        return false;
      }

      // Insert referral into wp_uap_referrals
      const [result] = await pool.execute<mysql.ResultSetHeader>(
        `INSERT INTO wp_uap_referrals
         (affiliate_id, amount, currency, reference, source, description, status, payment, date)
         VALUES (?, ?, 'EUR', ?, 'stripe', ?, 1, 0, NOW())`,
        [
          data.affiliateId,
          data.amount,
          data.stripeSubscriptionId,
          `Suscripción ${data.plan} - ${data.customerEmail}`,
        ]
      );

      logger.info('[AffiliateService] Referral created:', {
        referralId: result.insertId,
        affiliateId: data.affiliateId,
        amount: data.amount,
        plan: data.plan,
      });

      return true;
    } catch (error) {
      logger.error('[AffiliateService] Error creating referral:', { error, data });
      return false;
    }
  }

  /**
   * Process affiliate referral from Stripe checkout session
   */
  async processCheckoutReferral(
    clientReferenceId: string | null,
    plan: string,
    stripeSubscriptionId: string,
    customerEmail: string
  ): Promise<void> {
    const affiliateId = this.parseAffiliateId(clientReferenceId);

    if (!affiliateId) {
      logger.info('[AffiliateService] No affiliate ID in checkout session');
      return;
    }

    const commission = this.calculateCommission(plan);

    logger.info('[AffiliateService] Processing affiliate referral:', {
      affiliateId,
      plan,
      commission,
    });

    const success = await this.createReferral({
      affiliateId,
      plan,
      amount: commission,
      stripeSubscriptionId,
      customerEmail,
    });

    if (success) {
      logger.info('[AffiliateService] Affiliate referral processed successfully');
    } else {
      logger.error('[AffiliateService] Failed to process affiliate referral');
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

export const affiliateService = new AffiliateService();
